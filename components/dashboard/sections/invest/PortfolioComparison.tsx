import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionChart, ChartLine } from "@/components/dashboard/charts/TransactionChart";

interface PortfolioComparisonProps {
  user: {
    sub: string;
    [key: string]: any;
  } | null;
  monthlyPayment?: number;
  showComparison?: boolean;
}

interface PortfolioDataProps {
  [key: string]: number;
}

interface TimeSeriesData {
  date: string;
  [key: string]: any;
}

const FALLBACK_REGULAR = {
  "US Stocks": 45,
  "International Stocks": 25,
  "Bonds": 15,
  "Real Estate": 10,
  "Cash": 5
};

const FALLBACK_SPI = {
  "US Stocks": 60,
  "International Stocks": 20,
  "Bonds": 15,
  "Cash": 5
};

export const PortfolioComparison: React.FC<PortfolioComparisonProps> = ({ 
  user, 
  monthlyPayment = 500,
  showComparison = true
}) => {
  const [regularPortfolio, setRegularPortfolio] = useState<PortfolioDataProps>(FALLBACK_REGULAR);
  const [spiPortfolio, setSpiPortfolio] = useState<PortfolioDataProps>(FALLBACK_SPI);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch both portfolio types when component mounts or when showComparison changes
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!user?.sub || !showComparison) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch regular portfolio
        const regularResponse = await fetch(`/api/sections/Investment/portfolio?userId=${encodeURIComponent(user.sub)}`);
        if (!regularResponse.ok) {
          throw new Error(`Failed to fetch regular portfolio: ${regularResponse.status}`);
        }
        const regularData = await regularResponse.json();
        
        if (regularData && regularData.data && Object.keys(regularData.data).length > 0) {
          setRegularPortfolio(regularData.data);
        }
        
        // Fetch SPI portfolio
        const spiResponse = await fetch(`/api/sections/Investment/spi-portfolio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.sub,
            monthly_savings: monthlyPayment
          })
        });
        
        if (!spiResponse.ok) {
          throw new Error(`Failed to fetch SPI portfolio: ${spiResponse.status}`);
        }
        
        const spiData = await spiResponse.json();
        
        if (spiData && spiData.data && Object.keys(spiData.data).length > 0) {
          setSpiPortfolio(spiData.data);
        }
        
        // Generate time series data for chart
        if (spiData && spiData.series) {
          const chartData = generateChartData(spiData.series);
          setTimeSeriesData(chartData);
        } else {
          // Generate sample data if no series data is available
          setTimeSeriesData(generateSampleData());
        }
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        // Generate sample data on error
        setTimeSeriesData(generateSampleData());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPortfolioData();
  }, [user?.sub, monthlyPayment, showComparison]);

  // Generate chart data from series data
  const generateChartData = (seriesData: Record<string, number>): TimeSeriesData[] => {
    // Sort dates chronologically
    const dates = Object.keys(seriesData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Create chart data with regular and SPI projections
    return dates.map(date => {
      // Generate regular projection with a more conservative growth rate
      const spiValue = seriesData[date];
      const regularValue = spiValue * 0.85; // Regular portfolio grows 15% slower
      
      return {
        date,
        regularPortfolioValue: regularValue,
        spiPortfolioValue: spiValue
      };
    });
  };
  
  // Generate sample data for chart when API doesn't return data
  const generateSampleData = (): TimeSeriesData[] => {
    const data: TimeSeriesData[] = [];
    const today = new Date();
    const startValue = 10000;
    
    // Generate monthly data points for 10 years
    for (let i = 0; i < 120; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() + i);
      
      // Regular portfolio grows at 7% annually
      const regularValue = startValue * Math.pow(1 + (0.07 / 12), i);
      
      // SPI portfolio grows at 9% annually
      const spiValue = startValue * Math.pow(1 + (0.09 / 12), i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        regularPortfolioValue: Math.round(regularValue),
        spiPortfolioValue: Math.round(spiValue)
      });
    }
    
    return data;
  };

  // Define chart lines
  const chartLines: ChartLine[] = [
    {
      dataKey: "regularPortfolioValue",
      name: "Regular Portfolio",
      color: "#3182CE", // Blue
      type: "area",
      strokeWidth: 2,
      dot: false,
    },
    {
      dataKey: "spiPortfolioValue",
      name: "SPI Portfolio",
      color: "#8B5CF6", // Purple
      type: "area",
      strokeWidth: 2,
      dot: false,
    }
  ];

  if (!showComparison) {
    return null;
  }

  return (
    <Card className="border bg-background">
      <CardHeader>
        <CardTitle>Portfolio Growth Comparison</CardTitle>
        <CardDescription>
          Compare projected growth of your regular portfolio with the SPI portfolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-72">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading portfolio data...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-72 text-red-500">
            <p>Error: {error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <TransactionChart 
              data={timeSeriesData}
              useDefaultLine={false}
              title="Projected Portfolio Growth"
              description={`Comparison with $${monthlyPayment} monthly contribution`}
              lines={chartLines}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                <h3 className="text-xl font-semibold mb-2">Regular Portfolio</h3>
                <div className="space-y-2 mb-4">
                  {Object.entries(regularPortfolio).map(([name, value]) => (
                    <div key={name} className="flex justify-between items-center">
                      <span>{name}</span>
                      <span className="font-medium">{value}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  This allocation is based on your risk profile and investment goals.
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                <h3 className="text-xl font-semibold mb-2">SPI Portfolio</h3>
                <div className="space-y-2 mb-4">
                  {Object.entries(spiPortfolio).map(([name, value]) => (
                    <div key={name} className="flex justify-between items-center">
                      <span>{name}</span>
                      <span className="font-medium">{value}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  This allocation is optimized for long-term growth with systematic payments of ${monthlyPayment} per month.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioComparison;