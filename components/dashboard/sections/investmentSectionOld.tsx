"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { TransactionChart, ChartLine } from "@/components/dashboard/charts/TransactionChart";
import { ExtendedUser } from "@/hooks/useDataUser";
import { CategoryData, ITransaction } from "@/lib/types";
import { minimizeBudgetProjection } from "@/lib/sections/budget";
import { calculateInvestmentValue } from "@/lib/dataProcessing";



interface InvestmentSectionProps {
  user: ExtendedUser | null;
  userLoading: boolean;
  onBack: () => void;
}

export function InvestmentSection({ user, userLoading, onBack }: InvestmentSectionProps) {
  const dataFetchedRef = useRef(false);
  const transactionIdsRef = useRef<string[]>([]);

  const [chartData, setChartData] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorySettings, setCategorySettings] = useState<CategoryData | null>(null);

  // Fetch category settings
  useEffect(() => {
    const fetchCategorySettings = async () => {
      if (!user?.sub) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/sections/Budget/categories?userId=${encodeURIComponent(user.sub)}`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
        const data = await response.json() as CategoryData | null;
        setCategorySettings(data || {});
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategorySettings({});
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.sub && !categorySettings) {
      fetchCategorySettings();
    }
  }, [user?.sub, categorySettings]);

  // Generate chart data after category settings are loaded
  useEffect(() => {
    const generateChartData = async () => {
      if (!user?.data?.transactions || userLoading || isLoading || !categorySettings) return;
      
      // Check if we already have the data and it hasn't changed
      const currentTxIds = user.data.transactions.map(t => t.transaction_id).sort().join(",");
      if (
        transactionIdsRef.current.length > 0 &&
        currentTxIds === transactionIdsRef.current.join(",") &&
        chartData.length
      ) {
        return;
      }
      
      transactionIdsRef.current = currentTxIds.split(",");
      
      try {
        setIsLoading(true);
        
        // Generate chart data using the category settings from the API
        const projectionData = minimizeBudgetProjection(user.data.transactions, categorySettings);
        
        // Calculate investment value using the utility function
        const enhancedData = calculateInvestmentValue(projectionData);
        
        setChartData(enhancedData);
        dataFetchedRef.current = true;
      } catch (err) {
        console.error("Error generating chart data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (!dataFetchedRef.current && categorySettings) {
      generateChartData();
    }
  }, [user, userLoading, isLoading, chartData.length, categorySettings]);

  const lines: ChartLine[] = [
    {
      dataKey: "totalValue",
      name: "Investment Growth",
      color: "#10b981", // Green color for growth/investment
      type: "area",
      strokeWidth: 2,
      dot: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center mb-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle>Investment Analysis</CardTitle>
            <CardDescription>Loading investment data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Analyzing your investment patterns...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center mb-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle className="text-red-600">Error Loading Investment Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center mb-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle>Investment Analysis</CardTitle>
            <CardDescription>No transaction data available</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Investment Chart Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reset Data
            </Button>
          </div>
          <CardTitle>Investment Growth</CardTitle>
          <CardDescription>Track the cumulative value of your investments over time</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionChart
            title=""
            description=""
            data={chartData}
            useDefaultLine={false}
            lines={lines}
          />
        </CardContent>
      </Card>
    </div>
  );
}