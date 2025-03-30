import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { PortfolioDataProps } from '../sections/invest/types';

interface PortfolioPieChartProps {
  data: PortfolioDataProps;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

export const PortfolioPieChart = ({ 
  data, 
  activeIndex, 
  setActiveIndex 
}: PortfolioPieChartProps): React.ReactElement => {
  // Transform the data for the pie chart
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value
  }));

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
  const CustomTooltip = ({ active, payload }: any) => {
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
          <span className="mt-2 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-1 rounded-sm">
            {payload[0].name}
          </span>
        </div>
      );
    }
    return null;
  };

  // Refined active shape for smoother hover effect
  const renderActiveShape = (props: any) => {
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
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  // Handle mouse leave
  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Handle click on pie sectors
  const onPieClick = (_: any, index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  // Render custom legend items
  const renderLegendItem = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap gap-4 justify-start mt-2">
        {payload.map((entry: any, index: number) => {
          const isActive = activeIndex === index;
          return (
            <div 
              key={`legend-item-${index}`}
              className={`flex items-center px-2 py-1 rounded transition-all duration-200 cursor-pointer ${
                isActive ? 'bg-gray-800/40 shadow-sm scale-105' : 'hover:bg-gray-800/20'
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

export default PortfolioPieChart;