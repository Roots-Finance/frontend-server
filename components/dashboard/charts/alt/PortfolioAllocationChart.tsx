import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PortfolioAllocationChart = () => {
  // Dummy data in the format "assetName": "percentageAllocated"
  const dummyData = {
    "US Stocks": 45,
    "International Stocks": 25,
    "Bonds": 15,
    "Real Estate": 10,
    "Cash": 5
  };

  // Transform the data for the pie chart
  const chartData = Object.entries(dummyData).map(([name, value]) => ({
    name,
    value
  }));

  const [activeIndex, setActiveIndex] = useState(null);

  // Original color palette from TransactionChart
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
        <div className="bg-black/60 backdrop-blur-sm rounded-md shadow-md p-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Asset Allocation</span>
              <span className="font-bold" style={{ color: payload[0].color }}>
                {payload[0].value}%
              </span>
            </div>
          </div>
          <span className={`mt-2 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-1 rounded-sm`}>
            {payload[0].name}
          </span>
        </div>
      );
    }
    return null;
  };

  // Handle mouse enter on pie sectors
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // Handle mouse leave
  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Render custom legend items
  const renderLegendItem = (props) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap gap-4 justify-start mt-2">
        {payload.map((entry, index) => (
          <div 
            key={`legend-item-${index}`}
            className="flex items-center"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div 
              className="w-3 h-3 mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.value}: {entry.payload.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border border-b bg-background">
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
        <CardDescription>
          Asset allocation breakdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
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
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                isAnimationActive={false}
                stroke="rgba(0, 0, 0, 0.2)"
                strokeWidth={1}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegendItem} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioAllocationChart;