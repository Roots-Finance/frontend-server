// app/components/dashboard/investment/components/InvestmentChart.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionChart } from "@/components/dashboard/charts/TransactionChart";
import { InvestmentChartProps } from './types';

/**
 * Component for displaying investment performance chart
 */
export const InvestmentChart = ({ 
  chartData, 
  isChartLoading, 
  chartError, 
  lines, 
  resetChartData 
}: InvestmentChartProps): React.ReactElement => {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Investment Portfolio Performance</CardTitle>
        <CardDescription>Track your investment growth over time</CardDescription>
      </CardHeader>
      <CardContent>
        {isChartLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-sm text-muted-foreground">Analyzing your investment data...</p>
            </div>
          </div>
        ) : chartError ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">{chartError}</p>
            <Button onClick={resetChartData} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : (
          <TransactionChart title="" description="" data={chartData} useDefaultLine={false} lines={lines} />
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentChart;