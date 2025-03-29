import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

export const TraditionalPieChart = () => {
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

  // Enhanced active shape for elegant hover effects
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    
    // Calculate position for label
    const sin = Math.sin(-startAngle * Math.PI / 180);
    const cos = Math.cos(-startAngle * Math.PI / 180);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    
    return (
      <g>
        {/* Soft shadow effect */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 3}
          startAngle={startAngle - 0.5}
          endAngle={endAngle + 0.5}
          fill={"rgba(0,0,0,0.3)"}
          className="transition-all duration-300"
        />
        
        {/* Main expanded sector */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="transition-all duration-300"
        />
        
        {/* Add subtle highlight on top edge */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 3}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={"rgba(255,255,255,0.3)"}
          className="transition-all duration-300"
        />
        
        {/* Percentage label - only for larger segments */}
        {payload.value >= 10 && (
          <text
            x={cx + (outerRadius - 30) * Math.cos(-(startAngle + (endAngle - startAngle) / 2) * Math.PI / 180)}
            y={cy + (outerRadius - 30) * Math.sin(-(startAngle + (endAngle - startAngle) / 2) * Math.PI / 180)}
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="central"
            className="font-medium text-sm"
          >
            {`${payload.value}%`}
          </text>
        )}
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

  // Render custom legend items with improved visual feedback
  const renderLegendItem = (props) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap gap-4 justify-start mt-4">
        {payload.map((entry, index) => {
          const isActive = activeIndex === index;
          return (
            <div 
              key={`legend-item-${index}`}
              className={`flex items-center px-2 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                isActive ? 'bg-gray-800/40 shadow transform translate-y-[-2px]' : 'hover:bg-gray-800/20'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => onPieClick(null, index)}
            >
              <div 
                className={`h-3 rounded-sm transition-all duration-200 ${isActive ? 'w-4' : 'w-3'}`}
                style={{ 
                  backgroundColor: entry.color,
                  boxShadow: isActive ? `0 0 6px ${entry.color}80` : 'none',
                  marginRight: '8px'
                }}
              />
              <span className={`text-sm transition-all duration-200 ${
                isActive ? 'text-white font-medium' : 'text-muted-foreground'
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
              <defs>
                {COLORS.map((color, index) => (
                  <filter key={`shadow-${index}`} id={`shadow-${index}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
                  </filter>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={8}  // Small inner radius creates separation effect
                outerRadius={110}
                paddingAngle={3}  // Add padding between segments
                cornerRadius={1}  // Slightly rounded corners
                dataKey="value"
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                onClick={onPieClick}
                stroke="#121212"
                strokeWidth={1.5}
                strokeOpacity={0.5}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    style={{ 
                      filter: activeIndex === index ? `url(#shadow-${index})` : 'none',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    opacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.7}
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
      </CardContent>
    </Card>
  );
};

export default TraditionalPieChart;