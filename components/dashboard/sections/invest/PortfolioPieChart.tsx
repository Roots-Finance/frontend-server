// app/components/dashboard/investment/components/PortfolioPieChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { 
  PortfolioPieChartProps, 
  ActiveShapeProps, 
  CustomTooltipProps, 
  CustomLegendProps 
} from './types';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: CustomTooltipProps): React.ReactElement | null => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card rounded-md shadow-md p-2 border">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Asset Allocation</span>
          <span className="font-bold" style={{ color: payload[0].color }}>{payload[0].value}%</span>
        </div>
        <span className="mt-2 text-sm px-1 rounded-sm">{payload[0].name}</span>
      </div>
    );
  }
  return null;
};

// Active Shape for Pie Chart
const RenderActiveShape = (props: ActiveShapeProps): React.ReactElement => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const outerRadiusExpanded = outerRadius + 6;
  
  return (
    <g>
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

// Custom Legend Component
const CustomLegend = ({ payload, activeIndex, setActiveIndex }: CustomLegendProps): React.ReactElement => {
  return (
    <div className="flex flex-wrap gap-4 justify-start mt-2">
      {payload.map((entry, index: number) => {
        const isActive = activeIndex === index;
        return (
          <div 
            key={`legend-item-${index}`}
            className={`flex items-center px-2 py-1 rounded transition-all duration-200 cursor-pointer ${
              isActive ? 'bg-accent shadow-sm scale-105' : 'hover:bg-accent/50'
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={() => setActiveIndex(index === activeIndex ? null : index)}
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

// Portfolio Pie Chart Component
export const PortfolioPieChart = ({ data, activeIndex, setActiveIndex }: PortfolioPieChartProps): React.ReactElement => {
  // Transform the data for the pie chart
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value
  }));

  // Color palette
  const COLORS = [
    '#3182CE', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B'
  ];

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
            activeIndex={activeIndex === null ? undefined: activeIndex}
            activeShape={RenderActiveShape as any}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={(_, index) => setActiveIndex(index === activeIndex ? null : index)}
            stroke="rgba(0, 0, 0, 0.15)"
            strokeWidth={1}
          >
            {chartData.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="transition-opacity duration-300"
                opacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.6}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} animationDuration={200} />
          <Legend content={(props) => <CustomLegend {...props} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioPieChart;