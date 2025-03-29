// components/dashboard/sections/BudgetingSection.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, ExternalLink, BookOpen, FileText, DollarSign, RefreshCw } from "lucide-react";
import { TransactionChart, ChartLine } from "@/components/dashboard/charts/TransactionChart";
import { ResourceType } from "@/components/dashboard/types";
import { getResourceColor, getResourceIcon } from "./utils";
import { LessonViewer } from "@/components/dashboard/sections/LessonViewer";
import { ExtendedUser } from "@/hooks/useDataUser";
import { Slider } from "@/components/ui/slider";
import { ITransaction } from "@/lib/types";

// Define data structure for the chart data
export interface LessonContent {
  title: string;
  content: string;
  completed: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed?: boolean;
  content: LessonContent[];
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  description?: string;
}

export interface BudgetingSectionData {
  title: string;
  description: string;
  lessons: Lesson[];
  resources: Resource[];
  savings: {
    current: number;
    potential: number;
    percentIncrease: number;
  };
}

interface BudgetingSectionProps {
  user: ExtendedUser | null;
  userLoading: boolean;
  onBack: () => void;
}

export function BudgetingSection({ user, userLoading, onBack }: BudgetingSectionProps) {
  const dataFetchedRef = useRef(false);

  const [chartData, setChartData] = useState<ITransaction[]>([]);
  const [sectionData, setSectionData] = useState<BudgetingSectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  
  // State for category sliders
  const [categorySliders, setCategorySliders] = useState<{ [key: string]: number }>({});
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  // Store transaction IDs to detect changes
  const transactionIdsRef = useRef<string[]>([]);

  // Extract unique categories from transactions
  useEffect(() => {
    if (user?.data?.transactions != null) {
      // Get all unique primary categories from the transactions
      const categories = user.data.transactions
        .map(transaction => transaction.category)
        .filter((category): category is string => !!category); // Filter out undefined/null
      
      // Get unique categories
      const uniqueCats = [...new Set(categories)];
      setUniqueCategories(uniqueCats);
      
      // Initialize slider values if not already set
      const initialSliders: { [key: string]: number } = {};
      uniqueCats.forEach(category => {
        if (!(category in categorySliders)) {
          initialSliders[category] = 100; // Default to 100% (no reduction)
        }
      });
      
      if (Object.keys(initialSliders).length > 0) {
        setCategorySliders(prev => ({ ...prev, ...initialSliders }));
      }
    }
  }, [user?.data?.transactions, categorySliders]);

  // Effect to fetch chart data first, then section content
  useEffect(() => {
    const fetchBudgetData = async () => {
      // Don't fetch if already loading or no user
      if (!user || !user.data || userLoading || isLoading) return;
      
      // Check if we already have transactions and if they've changed
      const currentTransactionIds = user.data.transactions.map(t => t.transaction_id).sort().join(',');
      if (transactionIdsRef.current.length > 0 && 
          currentTransactionIds === transactionIdsRef.current.join(',') &&
          chartData.length > 0 && 
          sectionData !== null) {
        // Data hasn't changed, skip fetching
        return;
      }
      
      // Update transaction ID reference
      transactionIdsRef.current = currentTransactionIds.split(',');
      
      try {
        setIsLoading(true);

        // Step 1: Fetch chart data from the API
        const chartResponse = await fetch("/api/budget/minimize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chartData: user.data.transactions,
            chartConfig: {} // Initially empty config (no reductions)
          }),
        });
        if (!chartResponse.ok) {
          throw new Error(`Failed to fetch budget projection: ${chartResponse.status}`);
        }

        const projectionData = await chartResponse.json();
        setChartData(projectionData);

        // Step 2: Fetch section content using the chart data
        const contentResponse = await fetch("/api/sections/Budgeting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chartData: projectionData,
          }),
        });

        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch section content: ${contentResponse.status}`);
        }

        const contentData = await contentResponse.json();
        setSectionData({
          ...contentData,
        });
        
        // Mark data as fetched
        dataFetchedRef.current = true;
      } catch (err) {
        console.error("Error fetching budget data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we haven't already fetched data
    if (!dataFetchedRef.current) {
      fetchBudgetData();
    }

    // No dependencies on chartData or sectionData to prevent circular updates
  }, [user?.data?.transactions.length, userLoading, chartData.length, sectionData, user, isLoading]); 

  // Handle lesson completion
  const handleLessonComplete = (lessonId: string) => {
    setCompletedLessons((prev) => [...prev, lessonId]);
    setActiveLesson(null);
  };
  
  // Handle slider value change - only updates local state
  const handleSliderChange = (category: string, values: number[]) => {
    setCategorySliders(prev => ({
      ...prev,
      [category]: values[0]
    }));
  };
  
  // Apply category adjustments - calls API with current slider values
  const applyAdjustments = async () => {
    if (!user?.data?.transactions) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/budget/minimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chartData: user.data.transactions,
          chartConfig: categorySliders
        }),
      });
      
      if (!response.ok) throw new Error(`Failed to update budget projection: ${response.status}`);
      
      const projectionData = await response.json();
      setChartData(projectionData);
      
    } catch (err) {
      console.error("Error recalculating budget:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Configure the chart lines
  const lines: ChartLine[] = [
    {
      dataKey: "minimizedTotal",
      name: "With Less Discretionary Spending",
      color: "#8b5cf6", // Violet-500
      type: "area",
      strokeWidth: 2,
      dot: false,
    },
  ];

  // Manual refresh function - resets to initial state
  const handleManualRefresh = async () => {
    if (!user || !user.data) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const chartResponse = await fetch("/api/budget/minimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chartData: user.data.transactions,
          chartConfig: {} // Reset to no reductions
        }),
      });
      if (!chartResponse.ok) throw new Error(`Failed to fetch budget projection: ${chartResponse.status}`);
      const projectionData = await chartResponse.json();
      setChartData(projectionData);

      const contentResponse = await fetch("/api/sections/Budgeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartData: projectionData }),
      });

      if (!contentResponse.ok) throw new Error(`Failed to fetch section content: ${contentResponse.status}`);
      const contentData = await contentResponse.json();

      setSectionData({
        ...contentData,
      });
    } catch (err) {
      console.error("Error fetching budget data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center mb-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle>Budgeting</CardTitle>
            <CardDescription>Loading budget data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-4 text-sm text-muted-foreground">Analyzing your spending patterns...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center mb-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle className="text-red-600 dark:text-red-400">Error Loading Budget Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <Button
              onClick={handleManualRefresh}
              className="bg-primary hover:bg-primary/90"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Content loaded successfully
  return (
    <div className="space-y-6">
      {/* Lesson Viewer - shows when a lesson is active */}
      {activeLesson && (
        <LessonViewer
          lesson={activeLesson}
          chartData={chartData}
          lines={lines}
          onClose={() => setActiveLesson(null)}
          onComplete={handleLessonComplete}
        />
      )}

      {/* Budget Chart Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleManualRefresh}>
              Reset Data
            </Button>
          </div>
          <CardTitle>Transaction History with Budget Optimization</CardTitle>
          <CardDescription>Your balance with better spending habits</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionChart title="" description="" data={chartData} lines={lines} />
        </CardContent>
      </Card>
      
      {/* Category Sliders Card */}
      {uniqueCategories.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Spending Category Adjustments</CardTitle>
              <CardDescription>
                Adjust the sliders to see how changes in your spending would affect your financial situation
              </CardDescription>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 ml-4"
              onClick={applyAdjustments}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Apply Changes
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {uniqueCategories.map((category) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium">{category}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {categorySliders[category] || 100}%
                  </span>
                </div>
                <Slider
                  defaultValue={[categorySliders[category] || 100]}
                  max={100}
                  min={0}
                  step={5}
                  onValueChange={(values) => handleSliderChange(category, values)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {categorySliders[category] === 100
                    ? "No reduction in spending"
                    : `Reduced to ${categorySliders[category]}% of your current spending`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Budget Content Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{sectionData?.title || "Budgeting Fundamentals"}</CardTitle>
          <CardDescription className="text-base mt-2">
            {sectionData?.description || "Learn how to create and maintain a personal budget that helps you achieve your financial goals."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Potential Savings Summary */}
          {sectionData?.savings && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-1">Your Potential Savings</h3>
                    <p className="text-sm text-muted-foreground">
                      By optimizing your discretionary spending, you could increase your savings by
                      <span className="font-bold text-primary"> {sectionData.savings.percentIncrease}%</span>
                    </p>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Savings</div>
                      <div className="text-xl font-bold">${sectionData.savings.current}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Potential Savings</div>
                      <div className="text-xl font-bold text-primary">${sectionData.savings.potential}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lessons Section */}
          <div>
            <h3 className="text-xl font-medium mb-4 flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-primary" />
              Recommended Lessons
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionData?.lessons.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);

                return (
                  <Card
                    key={lesson.id}
                    className={`overflow-hidden border ${isCompleted ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10" : ""}`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">{lesson.title}</CardTitle>
                        {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground mb-4">{lesson.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-1 h-4 w-4" />
                          {lesson.duration}
                        </div>
                        <Button
                          size="sm"
                          className={isCompleted ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"}
                          onClick={() => setActiveLesson(lesson)}
                        >
                          {isCompleted ? "Review Lesson" : "Start Lesson"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Resources Section */}
          {sectionData?.resources != null && sectionData?.resources.length > 0 && (
            <div>
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Helpful Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sectionData?.resources.map((resource) => (
                  <Card key={resource.id} className="overflow-hidden border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-base">{resource.title}</h4>
                        <Badge className={`ml-2 ${getResourceColor(resource.type)}`}>
                          <span className="flex items-center">
                            {getResourceIcon(resource.type)}
                            <span className="ml-1">{resource.type}</span>
                          </span>
                        </Badge>
                      </div>
                      {resource.description && <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 flex items-center justify-center"
                        onClick={() => window.open(resource.url, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Resource
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}