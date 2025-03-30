// app/components/dashboard/investment/components/PortfolioControls.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { PortfolioControlsProps } from './types';

/**
 * Component for portfolio diversification and consolidation controls
 */
export const PortfolioControls = ({ 
  onDiversify, 
  onConsolidate, 
  isLoading, 
  loadingAction 
}: PortfolioControlsProps): React.ReactElement => {
  return (
    <div className="flex flex-col h-full justify-center space-y-6 p-4">
      <Button 
        onClick={onDiversify} 
        className="w-full"
        variant="outline"
        disabled={isLoading}
      >
        {isLoading && loadingAction === 'diversify' ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Diversifying...
          </>
        ) : 'Diversify'}
      </Button>
      <Button 
        onClick={onConsolidate} 
        className="w-full"
        variant="outline"
        disabled={isLoading}
      >
        {isLoading && loadingAction === 'consolidate' ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Consolidating...
          </>
        ) : 'Consolidate'}
      </Button>
    </div>
  );
};

export default PortfolioControls;