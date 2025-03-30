// components/dashboard/charts/PortfolioValueChart.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, Line, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Sample data - this would be replaced with actual data in production
const DUMMY_DATA = {
  real: {
    "2023-05-16": 0,
    "2023-07-15": 5000,
    "2023-09-30": 12000,
    "2023-12-25": 25000,
    "2024-02-10": 40000,
    "2024-05-01": 55000,
    "2024-07-06": 70000,
    "2024-10-18": 90000,
    "2025-01-15": 110000,
    "2025-03-30": 125000
  },
  withBudget: {
    "2023-05-16": 0,
    "2023-07-15": 7500,
    "2023-09-30": 18000,
    "2023-12-25": 35000,
    "2024-02-10": 60000,
    "2024-05-01": 85000,
    "2024-07-06": 110000,
    "2024-10-18": 140000,
    "2025-01-15": 170000,
    "2025-03-30": 190000
  }
};

// Define types for chart lines
export interface ChartLine {
  dataKey: string;
  name: string;
  color: string;
  type?: "line" | "area";
  strokeWidth?: number;
  dot?: boolean | object;
}

export interface PortfolioChartProps {
  realData?: Record<string, number>;
  budgetData?: Record<string, number>;
  title?: string;
  description?: string;
  additionalLines?: ChartLine[];
  children?: React.ReactNode;
}

// Helper function to format currency values
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to compare data for changes
const hasDataChanged = (prevData: any[], newData: any[]): boolean => {
  if (prevData.length !== newData.length) return true;
  if (prevData.length === 0) return false;
  
  // Just check the first and last items for simplicity
  const firstChanged = JSON.stringify(prevData[0]) !== JSON.stringify(newData[0]);
  const lastChanged = JSON.stringify(prevData[prevData.length - 1]) !== JSON.stringify(newData[newData.length - 1]);
  
  return firstChanged || lastChanged;
};

export function PortfolioValueChart({
  realData = DUMMY_DATA.real,
  budgetData = DUMMY_DATA.withBudget,
  title = "Portfolio Value Over Time",
  description = "Comparing actual portfolio performance vs. optimized investing",
  additionalLines = [],
  children,
}: PortfolioChartProps) {
  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCenter, setZoomCenter] = useState(0.5);
  const [visibleData, setVisibleData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const MAX_ZOOM = 5;
  
  // Track previous calculation inputs to prevent infinite updates
  const prevCalcInputsRef = useRef({ 
    dataLength: -1, 
    zoomLevel: -1, 
    zoomCenter: -1 
  });
  
  // Keep a reference to previous data for comparison
  const prevDataRef = useRef<any[]>([]);

  // Default lines
  // Change these two color values
const defaultLines: ChartLine[] = [
    {
      dataKey: "realValue",
      name: "Actual Balance",
      color: "#31ceb6", // This is already blue, so leave it
      type: "area",
      strokeWidth: 2,
      dot: false,
    },
    {
      dataKey: "budgetValue",
      name: "Portfolio Value",
      color: "#3182CE", // Change this from purple (#805AD5) to green (#10B981)
      type: "area",
      strokeWidth: 2,
      dot: false,
    }
  ];

  // Combine default lines with additional lines
  const allLines = [...defaultLines, ...additionalLines];

  // Function to merge and process data
  const processData = useMemo(() => {
    // Convert record objects to array format for chart
    const dates = new Set([
      ...Object.keys(realData),
      ...Object.keys(budgetData)
    ].sort());
    
    const chartData = Array.from(dates).map(date => {
      return {
        date,
        realValue: realData[date] || 0,
        budgetValue: budgetData[date] || 0
      };
    });
    
    return chartData;
  }, [realData, budgetData]);

  // Calculate visible data based on zoom level and center
  const calculateVisibleData = (data: any[], zoomLevel: number, zoomCenter: number) => {
    if (data.length === 0) return [];
    if (zoomLevel <= 1) return data;

    // Calculate the visible window
    const windowSize = 1 / zoomLevel;
    const halfWindowSize = windowSize / 2;
    
    // Calculate start and end positions
    let startPos = Math.max(0, zoomCenter - halfWindowSize);
    let endPos = Math.min(1, zoomCenter + halfWindowSize);
    
    // Adjust if window is partially outside the data range
    if (startPos < 0) {
      endPos = Math.min(1, endPos - startPos);
      startPos = 0;
    }
    if (endPos > 1) {
      startPos = Math.max(0, startPos - (endPos - 1));
      endPos = 1;
    }
    
    // Calculate actual indices
    const startIndex = Math.floor(startPos * (data.length - 1));
    const endIndex = Math.ceil(endPos * (data.length - 1));
    
    return data.slice(startIndex, endIndex + 1);
  };

  // Update visible data when zoom or data changes
  useEffect(() => {
    const currentData = processData;
    const currentInputs = { 
      dataLength: currentData.length, 
      zoomLevel, 
      zoomCenter 
    };
    
    // Check if data or zoom parameters have changed
    const dataChanged = hasDataChanged(prevDataRef.current, currentData);
    const zoomChanged = 
      prevCalcInputsRef.current.zoomLevel !== currentInputs.zoomLevel ||
      prevCalcInputsRef.current.zoomCenter !== currentInputs.zoomCenter;
    
    // Only recalculate if something has changed
    if (dataChanged || zoomChanged) {
      setVisibleData(calculateVisibleData(currentData, zoomLevel, zoomCenter));
      prevDataRef.current = [...currentData];
      prevCalcInputsRef.current = currentInputs;
    }
  }, [processData, zoomLevel, zoomCenter]);

  // Setup wheel event listeners for zooming
  useEffect(() => {
    const chartElement = chartRef.current;
    if (!chartElement) return;
    
    const wheelListener = (e: WheelEvent) => {
      if (!chartElement.contains(e.target as Node)) return;
      e.preventDefault();
      
      // Calculate relative mouse position within chart
      const rect = chartElement.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      
      // Update zoom level
      const zoomDelta = e.deltaY * -0.001;
      const newZoomLevel = Math.max(1, Math.min(MAX_ZOOM, zoomLevel + zoomDelta * zoomLevel));
      
      if (newZoomLevel === zoomLevel) return;
      
      // Adjust zoom center when zooming in
      if (newZoomLevel > zoomLevel) {
        const newCenter = zoomCenter + (relativeX - zoomCenter) * 0.2;
        setZoomCenter(Math.max(0, Math.min(1, newCenter)));
      }
      
      setZoomLevel(newZoomLevel);
    };
    
    chartElement.addEventListener('wheel', wheelListener, { passive: false });
    
    // Handle window resize - without unnecessary state updates
    const handleResize = () => {
      if (zoomLevel <= 1) return;
      // Reset calculation cache to force recalculation
      prevCalcInputsRef.current = { dataLength: -1, zoomLevel: -1, zoomCenter: -1 };
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      chartElement.removeEventListener('wheel', wheelListener);
      window.removeEventListener('resize', handleResize);
    };
  }, [zoomLevel, zoomCenter]);

  // Event handlers for panning
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setZoomLevel(1);
    setZoomCenter(0.5);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const dragDistance = (e.clientX - dragStartX) / rect.width;
    const windowSize = 1 / zoomLevel;
    const newCenter = zoomCenter - dragDistance * windowSize;
    
    setZoomCenter(Math.max(0, Math.min(1, newCenter)));
    setDragStartX(e.clientX);
  };
  
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-xs font-medium mb-1">{label}</p>
        <div className="grid grid-cols-1 gap-2">
          {payload.map((entry: any, index: number) => {
            const line = allLines.find((l: ChartLine) => l.dataKey === entry.dataKey);
            return (
              <div key={index} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{line?.name || entry.name}</span>
                <span className="font-bold" style={{ color: line?.color || entry.color }}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
        
        {payload.length >= 2 && (
          <div className="mt-2 pt-1 border-t text-xs">
            <span className="text-muted-foreground">Difference: </span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(payload[1].value - payload[0].value)}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Format date for x-axis
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} {zoomLevel > 1 ? `(${Math.round(zoomLevel * 100)}% zoom)` : ''}
        </CardDescription>
        <div className="text-xs text-muted-foreground">
          Use mouse wheel to zoom, drag to pan when zoomed in, right-click to reset zoom
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={chartRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          style={{ 
            cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default'), 
            position: 'relative',
            width: '100%',
            height: '350px'
          }}
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={visibleData.length > 0 ? visibleData : processData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-sm text-muted-foreground" 
                tick={{ fill: "currentColor" }}
                tickFormatter={formatXAxis}
              />
              <YAxis 
                className="text-sm text-muted-foreground" 
                tick={{ fill: "currentColor" }} 
                tickFormatter={(value) => formatCurrency(value)}
              />
              
              {/* Gradient definitions */}
              <defs>
                {allLines.map((line, index) => (
                  <linearGradient key={`gradient-${index}`} id={`chartGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={line.color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={line.color} stopOpacity={0.4} />
                  </linearGradient>
                ))}
              </defs>
              
              {/* Area/Line elements */}
              {allLines.map((line, index) =>
                line.type === "area" ? (
                  <Area
                    key={`area-${index}`}
                    type="monotone"
                    dataKey={line.dataKey}
                    name={line.name}
                    strokeWidth={line.strokeWidth || 2}
                    stroke={line.color}
                    fill={`url(#chartGradient${index})`}
                    dot={line.dot}
                    isAnimationActive={false}
                    stackId={line.dataKey === "budgetValue" ? undefined : "1"}
                  />
                ) : (
                  <Line
                    key={`line-${index}`}
                    type="monotone"
                    dataKey={line.dataKey}
                    name={line.name}
                    strokeWidth={line.strokeWidth || 2}
                    stroke={line.color}
                    dot={line.dot}
                    isAnimationActive={false}
                  />
                )
              )}

              <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
              <Legend />

              {children}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}