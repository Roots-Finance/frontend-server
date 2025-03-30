// app/components/dashboard/investment/components/PortfolioAllocationManager.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { PortfolioAllocationProps, PortfolioDataProps, AIPortfolioResponse } from './types';
import PortfolioPieChart from './PortfolioPieChart';
import PortfolioControls from './PortfolioControls';

/**
 * Component for managing portfolio allocation
 */
export const PortfolioAllocationManager = ({ user, isLoading }: PortfolioAllocationProps): React.ReactElement => {
  // Portfolio data state
  const [portfolioData, setPortfolioData] = useState<PortfolioDataProps>({});
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string>('');

  // Load user's portfolio data when component mounts
  useEffect(() => {
    if (user?.sub) {
      fetchPortfolioData(user.sub);
    }
  }, [user?.sub]);

  // Fetch portfolio allocation from API
  const fetchPortfolioData = async (userId: string): Promise<void> => {
    try {
      setIsPortfolioLoading(true);
      
      const response = await fetch(`/api/sections/Investment/portfolio?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error(`Failed to fetch portfolio data: ${response.status}`);
      
      const data = await response.json() as PortfolioDataProps;
      setPortfolioData(data);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // Set fallback data if needed
      setPortfolioData({
        "US Stocks": 45,
        "International Stocks": 25,
        "Bonds": 15,
        "Real Estate": 10,
        "Cash": 5
      });
    } finally {
      setIsPortfolioLoading(false);
    }
  };

  // Handler for the Diversify button
  const handleDiversify = async (): Promise<void> => {
    if (!user?.sub) return;
    
    setIsPortfolioLoading(true);
    setLoadingAction('diversify');
    
    try {
      // Call AI portfolio endpoint
      const response = await fetch(`/api/user/${user.sub}/ai-portfolio`);
      if (!response.ok) throw new Error(`Failed to diversify portfolio: ${response.status}`);
      
      const result = await response.json() as AIPortfolioResponse;
      
      if (result.status === 1 && result.data) {
        // Remove any non-allocation fields like 'reasoning'
        const newPortfolio: PortfolioDataProps = { ...result.data };
        if ('reasoning' in newPortfolio) {
          delete newPortfolio.reasoning;
        }
        
        setPortfolioData(newPortfolio);
        
        // Save the updated portfolio
        await savePortfolioData(user.sub, newPortfolio);
      } else {
        throw new Error(result.message || 'Failed to generate diversified portfolio');
      }
    } catch (error) {
      console.error('Error diversifying portfolio:', error);
    } finally {
      setIsPortfolioLoading(false);
      setLoadingAction('');
    }
  };

  // Handler for the Consolidate button
  const handleConsolidate = async (): Promise<void> => {
    if (!user?.sub) return;
    
    setIsPortfolioLoading(true);
    setLoadingAction('consolidate');
    
    try {
      // In a real app, you would call a separate API endpoint
      // For now, we'll use a predefined consolidated portfolio
      const consolidatedPortfolio: PortfolioDataProps = {
        "US Stocks": 60,
        "International Stocks": 20,
        "Bonds": 15,
        "Cash": 5
      };
      
      setPortfolioData(consolidatedPortfolio);
      
      // Save the updated portfolio
      await savePortfolioData(user.sub, consolidatedPortfolio);
    } catch (error) {
      console.error('Error consolidating portfolio:', error);
    } finally {
      setIsPortfolioLoading(false);
      setLoadingAction('');
    }
  };

  // Save portfolio data to API
  const savePortfolioData = async (userId: string, portfolio: PortfolioDataProps): Promise<void> => {
    try {
      const response = await fetch('/api/sections/Investment/set-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, portfolio }),
      });
      
      if (!response.ok) throw new Error(`Failed to save portfolio: ${response.status}`);
    } catch (error) {
      console.error('Error saving portfolio data:', error);
    }
  };

  return (
    <Card className="border bg-background">
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
        <CardDescription>
          Asset allocation breakdown with management controls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 relative">
            {(isLoading || isPortfolioLoading) && (
              <div className="absolute inset-0 bg-card/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                <div className="flex flex-col items-center bg-card p-4 rounded-lg shadow-lg border">
                  <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                  <p className="text-sm font-medium">
                    {isPortfolioLoading 
                      ? loadingAction === 'diversify' 
                        ? 'Diversifying your portfolio...' 
                        : 'Consolidating your portfolio...'
                      : 'Loading portfolio data...'}
                  </p>
                </div>
              </div>
            )}
            <PortfolioPieChart 
              data={portfolioData} 
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          </div>
          
          <div className="mx-4 my-6 md:my-0">
            <Separator orientation="vertical" className="h-[200px]" />
          </div>
          
          <div className="w-2/5 text-center">
            <h1 className="text-2xl font-bold">Investment Wizard</h1>
            <PortfolioControls 
              onDiversify={handleDiversify} 
              onConsolidate={handleConsolidate}
              isLoading={isPortfolioLoading}
              loadingAction={loadingAction}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioAllocationManager;