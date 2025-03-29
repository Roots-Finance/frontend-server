// components/dashboard/TransactionChart.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, Line, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getTransactionColor } from "../sections/utils";
import { ITransaction } from "@/lib/types";

// Define types for chart lines
export interface ChartLine {
  dataKey: string;
  name: string;
  color: string;
  type?: "line" | "area";
  strokeWidth?: number;
  dot?: boolean | object;
}

export interface TransactionChartProps {
  data?: ITransaction[];
  title?: string;
  description?: string;
  lines?: ChartLine[];
  children?: React.ReactNode;
}

export function TransactionChart({
  data = [],
  title = "Transaction History",
  description = "Your balance over time",
  lines = [],
  children,
}: TransactionChartProps) {

  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCenter, setZoomCenter] = useState(0.5);
  const [visibleData, setVisibleData] = useState<ITransaction[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const MAX_ZOOM = 5;
  
  // Track previous calculation inputs to prevent infinite updates
  const prevCalcInputsRef = useRef({ dataLength: -1, zoomLevel: -1, zoomCenter: -1 });

  // Default line for balance
  const defaultLine: ChartLine = {
    dataKey: "overallTotal",
    name: "Actual Balance",
    color: "#3182CE",
    type: "area",
    strokeWidth: 2,
    dot: false,
  };

  // Combine default line with custom lines
  const allLines = [defaultLine, ...lines];

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

  // Calculate visible data based on zoom level and center
  const calculateVisibleData = (data: ITransaction[], zoomLevel: number, zoomCenter: number) => {
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
    const currentInputs = { 
      dataLength: data.length, 
      zoomLevel, 
      zoomCenter 
    };
    
    // Only recalculate if inputs have changed
    if (prevCalcInputsRef.current.dataLength !== currentInputs.dataLength ||
        prevCalcInputsRef.current.zoomLevel !== currentInputs.zoomLevel ||
        prevCalcInputsRef.current.zoomCenter !== currentInputs.zoomCenter) {
      
      setVisibleData(calculateVisibleData(data, zoomLevel, zoomCenter));
      prevCalcInputsRef.current = currentInputs;
    }
  }, [data, zoomLevel, zoomCenter]);

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
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2">
          {payload.map((entry: any, index: number) => {
            const line = allLines.find((l: ChartLine) => l.dataKey === entry.dataKey);
            return (
              <div key={index} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{line?.name || entry.name}</span>
                <span className="font-bold" style={{ color: line?.color || entry.color }}>
                  ${entry.value?.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
        {payload[0].payload.name && (
          <span className={`mt-2 text-sm ${getTransactionColor(payload[0].payload)} px-1 rounded-sm`}>
            {payload[0].payload.name} (${(-payload[0].payload.amount || 0).toFixed(2)})
          </span>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} {zoomLevel > 1 ? `(${Math.round(zoomLevel * 100)}% zoom)` : ''}
        </CardDescription>
        {data.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Use mouse wheel to zoom, drag to pan when zoomed in, right-click to reset zoom
          </div>
        )}
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
              data={visibleData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-sm text-muted-foreground" 
                tick={{ fill: "currentColor" }} 
              />
              <YAxis 
                className="text-sm text-muted-foreground" 
                tick={{ fill: "currentColor" }} 
                tickFormatter={(value) => `$${value}`}
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