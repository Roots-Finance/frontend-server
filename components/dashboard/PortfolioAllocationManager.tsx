// app/components/dashboard/PortfolioAllocationManager.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Portfolio Pie Chart Component
export const PortfolioPieChart = ({ data, activeIndex, setActiveIndex }) => {
  // Transform the data for the pie chart
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value
  }));

  // Color palette
  const COLORS = [
    '#3182CE', // Blue (matching the chart line)
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#F59E0B'  // Amber
  ];

  // Custom tooltip that matches the TransactionChart style
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card rounded-md shadow-md p-2 border">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Asset Allocation</span>
              <span className="font-bold" style={{ color: payload[0].color }}>
                {payload[0].value}%
              </span>
            </div>
          </div>
          <span className="mt-2 text-sm px-1 rounded-sm">
            {payload[0].name}
          </span>
        </div>
      );
    }
    return null;
  };

  // Refined active shape for smoother hover effect
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    // Subtle expansion for hover state
    const outerRadiusExpanded = outerRadius + 6;
    
    return (
      <g>
        {/* Outer glowing effect */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadiusExpanded + 2}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={"rgba(0,0,0,0.15)"}
          className="transition-all duration-300"
        />
        
        {/* Main expanded sector */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadiusExpanded}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="transition-all duration-300"
        />
        
        {/* Inner highlight ring */}
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 2}
          outerRadius={innerRadius}
          fill={"rgba(255,255,255,0.3)"}
          className="transition-all duration-300"
        />
      </g>
    );
  };

  // Handle mouse enter on pie sectors
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // Handle mouse leave
  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Handle click on pie sectors
  const onPieClick = (_, index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  // Render custom legend items
  const renderLegendItem = (props) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap gap-4 justify-start mt-2">
        {payload.map((entry, index) => {
          const isActive = activeIndex === index;
          return (
            <div 
              key={`legend-item-${index}`}
              className={`flex items-center px-2 py-1 rounded transition-all duration-200 cursor-pointer ${
                isActive ? 'bg-accent shadow-sm scale-105' : 'hover:bg-accent/50'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => onPieClick(null, index)}
            >
              <div 
                className={`h-3 mr-2 transition-all duration-200 ${isActive ? 'w-4' : 'w-3'}`}
                style={{ 
                  backgroundColor: entry.color,
                  boxShadow: isActive ? `0 0 6px ${entry.color}80` : 'none'
                }}
              />
              <span className={`text-sm transition-all duration-200 ${
                isActive ? 'font-medium' : 'text-muted-foreground'
              }`}>
                {entry.value}: {entry.payload.value}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            onClick={onPieClick}
            stroke="rgba(0, 0, 0, 0.15)"
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="transition-opacity duration-300"
                opacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.6}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />} 
            animationDuration={200}
          />
          <Legend content={renderLegendItem} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Portfolio Control Buttons Component
const PortfolioControls = ({ onDiversify, onConsolidate, isLoading }) => {
  return (
    <div className="flex flex-col h-full justify-center space-y-6 p-4">
      <Button 
        onClick={onDiversify} 
        className="w-full"
        variant="outline"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            Diversify
          </>
        ) : (
          'Diversify'
        )}
      </Button>
      <Button 
        onClick={onConsolidate} 
        className="w-full"
        variant="outline"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            Consolidate
          </>
        ) : (
          'Consolidate'
        )}
      </Button>
    </div>
  );
};

// Main Portfolio Container Component
const PortfolioAllocationManager = () => {
  // Initial dummy data
  const [portfolioData, setPortfolioData] = useState({
    "US Stocks": 45,
    "International Stocks": 25,
    "Bonds": 15,
    "Real Estate": 10,
    "Cash": 5
  });
  
  const [activeIndex, setActiveIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');

  // Simulate an API call with a delay
  const simulateApiCall = (data, delay = 1500) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, delay);
    });
  };

  // Handler for the Diversify button
  const handleDiversify = async () => {
    setIsLoading(true);
    setLoadingAction('diversify');
    
    // Simulate API call to backend
    const newData = await simulateApiCall({
      "US Stocks": 30,
      "International Stocks": 20,
      "Bonds": 15,
      "Real Estate": 15,
      "Cash": 10,
      "Commodities": 5,
      "Cryptocurrency": 5
    });
    
    setPortfolioData(newData);
    setIsLoading(false);
    setLoadingAction('');
  };

  // Handler for the Consolidate button
  const handleConsolidate = async () => {
    setIsLoading(true);
    setLoadingAction('consolidate');
    
    // Simulate API call to backend
    const newData = await simulateApiCall({
      "US Stocks": 60,
      "International Stocks": 20,
      "Bonds": 15,
      "Cash": 5
    });
    
    setPortfolioData(newData);
    setIsLoading(false);
    setLoadingAction('');
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
          {/* Left side: Portfolio Pie Chart */}
          <div className="flex-1 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-card/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                <div className="flex flex-col items-center bg-card p-4 rounded-lg shadow-lg border">
                  <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                  <p className="text-sm font-medium">
                    {loadingAction === 'diversify' ? 'Diversifying your portfolio...' : 'Consolidating your portfolio...'}
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
          
          {/* Divider */}
          <div className="mx-4 my-6 md:my-0">
            <Separator orientation="vertical" className="h-[200px]" />
          </div>
          
          {/* Right side: Control Buttons */}
          <div className="w-2/5 text-center">
            <h1 className="text-2xl font-bold">Investment Wizard</h1>
            <PortfolioControls 
              onDiversify={handleDiversify} 
              onConsolidate={handleConsolidate}
              isLoading={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioAllocationManager;