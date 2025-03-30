"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, ExternalLink, BookOpen, FileText, DollarSign, RefreshCw, Save } from "lucide-react";
import { TransactionChart, ChartLine } from "@/components/dashboard/charts/TransactionChart";
import { getResourceColor, getResourceIcon } from "./utils";
import { LessonViewer } from "@/components/dashboard/LessonViewer";
import { ExtendedUser } from "@/hooks/useDataUser";
import { Slider } from "@/components/ui/slider";
import { CategoryData, ITransaction } from "@/lib/types";
import { minimizeBudgetProjection } from "@/lib/sections/budget";
import { FullLessonData, Lesson, ResourceType } from "../types";
import { Toaster } from "@/components/ui/sonner";

interface BudgetingSectionProps {
  user: ExtendedUser | null;
  userLoading: boolean;
  onBack: () => void;
}

/** Updated props for the sliders card to include savings information. */
interface CategorySlidersCardProps {
  uniqueCategories: string[];
  categorySliders: CategoryData;
  spendingData: { [category: string]: number }; // spending totals per category
  isSaving: boolean;
  reasoning?: string;
  onSliderChange: (category: string, values: number[]) => void;
  onSaveBudget: () => void;
  onAISliders: () => void;
  totalSavings: number;
  perMonthSaving: number;
}

function CategorySlidersCard({
  uniqueCategories,
  categorySliders,
  spendingData,
  isSaving,
  reasoning,
  onSliderChange,
  onSaveBudget,
  onAISliders,
  totalSavings,
  perMonthSaving,
}: CategorySlidersCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex items-center justify-between">
        {/* Left side: Title and Description */}
        <div className="flex-1">
          <CardTitle className="text-xl font-bold">Spending Category Adjustments</CardTitle>
          <CardDescription className="text-sm">
            Adjust the sliders to see how changes in your spending affect your finances.
          </CardDescription>
        </div>
        {/* Center: Total Savings Display */}
        <div className="mx-4 text-center">
          <h2 className="text-2xl font-bold text-green-600">${totalSavings.toFixed(2)}</h2>
          <p className="text-sm text-green-600">Per Month: ${perMonthSaving.toFixed(2)}</p>
        </div>
        {/* Right side: Buttons */}
        <div className="flex gap-2">
          <Button onClick={onAISliders} variant="outline" size="sm">
            AI Sliders
          </Button>
          <Button 
            onClick={onSaveBudget} 
            disabled={isSaving}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Budget
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {/* Optionally display AI reasoning */}
      {reasoning && (
        <div className="mx-4 my-2 p-3 bg-gray-100 rounded-md text-sm italic">
          {reasoning}
        </div>
      )}
      <CardContent className="space-y-6">
        {uniqueCategories.map((category) => {
          const sliderValue = categorySliders[category] || 100;
          // Retrieve total spending for this category
          const totalSpent = spendingData[category] || 0;
          // Calculate saved amount based on slider value
          const savedAmount = totalSpent * (100 - sliderValue) / 100;
          return (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium">{category}</span>
                </div>
                <span className="text-sm font-medium">{sliderValue}%</span>
              </div>
              <Slider
                defaultValue={[sliderValue]}
                value={[sliderValue]}
                max={100}
                min={0}
                step={1}
                onValueChange={(values) => onSliderChange(category, values)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {sliderValue === 100
                  ? "No reduction in spending"
                  : `Reduced to ${sliderValue}% of spending, saving $${savedAmount.toFixed(2)}`}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function BudgetingSection({ user, userLoading, onBack }: BudgetingSectionProps) {
  const chartDataFetchedRef = useRef(false);
  const lessonsFetchedRef = useRef(false);
  const transactionIdsRef = useRef<string[]>([]);

  const [chartData, setChartData] = useState<ITransaction[]>([]);
  const [sectionData, setSectionData] = useState<FullLessonData | null>(null);
  
  // Separate loading states for different parts of the page
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Separate error states
  const [chartError, setChartError] = useState<string | null>(null);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const [categorySliders, setCategorySliders] = useState<CategoryData>({});
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [userBudget, setUserBudget] = useState<CategoryData | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>("");
  const [spendingData, setSpendingData] = useState<{ [category: string]: number }>({});

  // Initial load for default categories
  useEffect(() => {
    const loadDefaultCategories = async () => {
      if (!user?.sub) return;
      try {
        const response = await fetch(`/api/sections/Budget/categories?userId=${encodeURIComponent(user.sub)}`);
        if (!response.ok) throw new Error(`Failed to fetch default categories: ${response.status}`);
        const data = await response.json() as CategoryData | null;
        const defaultBudget = data || {};
        setUserBudget(defaultBudget);
        setCategorySliders(defaultBudget);
      } catch (err) {
        console.error("Error loading default categories:", err);
        setUserBudget({});
        setCategorySliders({});
      }
    };
    loadDefaultCategories();
  }, [user?.sub]);

  // Update unique categories and compute spending totals
  useEffect(() => {
    if (user?.data?.transactions) {
      const categories = Array.from(
        new Set(user.data.transactions.map(tx => tx.category).filter(Boolean))
      ).filter(category =>
        user.data!.transactions.some(tx => tx.category === category && !tx.isCredit)
      );
      setUniqueCategories(categories);
      
      const totals: { [key: string]: number } = {};
      user.data.transactions.forEach(tx => {
        if (tx.category && !tx.isCredit) {
          totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
        }
      });
      setSpendingData(totals);

      setCategorySliders(prev => {
        const updated = { ...prev };
        categories.forEach(category => {
          if (updated[category] == null) updated[category] = 100;
        });
        return updated;
      });
    }
  }, [user?.data?.transactions]);

  // Fetch chart data - separated from lessons content
  useEffect(() => {
    const fetchChartData = async () => {
      if (!user || !user.data || userLoading || isChartLoading) return;
      
      const currentTxIds = user.data.transactions.map(t => t.transaction_id).sort().join(",");
      if (
        transactionIdsRef.current.length > 0 &&
        currentTxIds === transactionIdsRef.current.join(",") &&
        chartData.length
      ) {
        return;
      }
      
      transactionIdsRef.current = currentTxIds.split(",");
      
      try {
        setIsChartLoading(true);
        const projectionData = minimizeBudgetProjection(user.data.transactions, {});
        setChartData(projectionData);
        chartDataFetchedRef.current = true;
      } catch (err) {
        console.error("Error generating chart data:", err);
        setChartError(err instanceof Error ? err.message : "An unknown error occurred generating chart data");
      } finally {
        setIsChartLoading(false);
      }
    };

    if (!chartDataFetchedRef.current) {
      fetchChartData();
    }
  }, [user, userLoading, isChartLoading, chartData.length]);

  // Fetch lessons content separately - no dependency on chart data
  useEffect(() => {
    // Fetch lessons regardless of chart data status
    if (!lessonsFetchedRef.current) {
      fetchLessonsContent();
    }
  }, [user?.sub, isLessonsLoading, sectionData]);

  // Update chart automatically when sliders change
  useEffect(() => {
    if (!user?.data?.transactions) return;
    const updatedProjection = minimizeBudgetProjection(user.data.transactions, categorySliders);
    setChartData(updatedProjection);
  }, [categorySliders, user]);

  // AI Sliders: Fetch new slider values from the AI endpoint.
  const handleAISliders = async () => {
    if (!user?.sub) return;
    try {
      const response = await fetch(`/api/sections/Budget/ai-categories?userId=${encodeURIComponent(user.sub)}`);
      if (!response.ok) throw new Error("Failed to fetch AI categories");
      const responseData = await response.json();
      console.log(response)
    
      const aiData = responseData;
      // Extract reasoning if it exists
      const reasoning = aiData.reasoning || "";
      delete aiData.reasoning;
      
      setUserBudget(aiData);
      setCategorySliders(aiData);
      setAiReasoning(reasoning);
      
    } catch (err) {
      console.error("Error updating AI sliders:", err);
    }
  };

  // Save current slider values
  const handleSaveBudget = async () => {
    if (!user?.sub) return;
    try {
      setIsSaving(true);
      const response = await fetch(`/api/sections/Budget/set-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.sub, budget: categorySliders }),
      });
      if (!response.ok) throw new Error(`Failed to save budget: ${response.status}`);
      const updatedBudget = await response.json() as CategoryData;
      setUserBudget(updatedBudget);
    } catch (err) {
      console.error("Error saving budget:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSliderChange = (category: string, values: number[]) => {
    setCategorySliders(prev => ({ ...prev, [category]: values[0] }));
  };

  const lines: ChartLine[] = [
    {
      dataKey: "minimizedTotal",
      name: "With Less Discretionary Spending",
      color: "#8b5cf6",
      type: "area",
      strokeWidth: 2,
      dot: false,
    },
  ];

  // Compute total savings across all categories
  const totalSavings = uniqueCategories.reduce((acc, category) => {
    const sliderValue = categorySliders[category] || 100;
    const totalSpent = spendingData[category] || 0;
    return acc + totalSpent * (100 - sliderValue) / 100;
  }, 0);

  // Determine the number of months in the data period.
  let earliest: Date | undefined;
  let latest: Date | undefined;
  for (const tx of chartData) {
    const date = new Date(tx.date);
    if (!earliest || date < earliest) earliest = date;
    if (!latest || date > latest) latest = date;
  }

  // No transaction data - render a basic message  
  if (!user?.data?.transactions?.length) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center mb-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle>Budgeting</CardTitle>
            <CardDescription>No transaction data available</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calculate monthly savings if we have date range
  const perMonthSaving = (earliest && latest) ? 
    totalSavings / (((latest.getFullYear() - earliest.getFullYear()) * 12) + latest.getMonth() - earliest.getMonth() + 1) : 
    0;

  return (
    <div className="space-y-6">
      {activeLesson && (
        <LessonViewer
          lesson={activeLesson}
          chartData={chartData}
          lines={lines}
          onClose={() => setActiveLesson(null)}
          onComplete={(lessonId) => {
            setCompletedLessons(prev => [...prev, lessonId]);
            setActiveLesson(null);
          }}
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
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reset Data
            </Button>
          </div>
          <CardTitle>Transaction History with Budget Optimization</CardTitle>
          <CardDescription>Your balance with better spending habits</CardDescription>
        </CardHeader>
        <CardContent>
          {isChartLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Analyzing your spending patterns...</p>
              </div>
            </div>
          ) : chartError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">{chartError}</p>
              <Button onClick={() => {
                chartDataFetchedRef.current = false;
                setChartError(null);
                window.location.reload();
              }} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : (
            <TransactionChart title="" description="" data={chartData} lines={lines} />
          )}
        </CardContent>
      </Card>

      {/* Sliders Card - show as soon as chart data is available */}
      {!isChartLoading && !chartError && uniqueCategories.length > 0 && (
        <CategorySlidersCard 
          uniqueCategories={uniqueCategories}
          categorySliders={categorySliders}
          spendingData={spendingData}
          isSaving={isSaving}
          reasoning={aiReasoning}
          onSliderChange={handleSliderChange}
          onSaveBudget={handleSaveBudget}
          onAISliders={handleAISliders}
          totalSavings={totalSavings}
          perMonthSaving={perMonthSaving}
        />
      )}

      {/* Budget Content Card - independently loadable */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {sectionData?.title || "Budgeting Fundamentals"}
          </CardTitle>
          <CardDescription className="mt-2 text-base">
            {sectionData?.description ||
              "Learn how to create and maintain a personal budget to achieve your financial goals."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-xl font-medium mb-4 flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-primary" />
              Recommended Lessons
            </h3>
            
            {isLessonsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Loading personalized lessons...</p>
                </div>
              </div>
            ) : lessonsError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-500 mb-2">{lessonsError}</p>
                <Button onClick={() => {
                  lessonsFetchedRef.current = false;
                  setLessonsError(null);
                  setIsLessonsLoading(true);
                  // Retry fetching lessons
                  fetchLessonsContent();
                }} variant="outline" size="sm">
                  Retry Loading Lessons
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionData?.lessons?.length ? sectionData.lessons.map((lesson) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  return (
                    <Card
                      key={lesson.id}
                      className={`overflow-hidden border ${isCompleted ? "border-green-500/50 bg-green-50/50" : ""}`}
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
                }) : (
                  <p className="text-muted-foreground col-span-2">No lessons available at this time.</p>
                )}
              </div>
            )}
          </div>
          
          {/* Resources section - show placeholder if still loading */}
          <div>
            <h3 className="text-xl font-medium mb-4 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Helpful Resources
            </h3>
            
            {isLessonsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading resources...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sectionData?.resources?.length ? (
                  sectionData.resources.map((resource) => (
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
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                        )}
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
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-3">No resources available at this time.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );

  // Helper function for fetching lessons content
  async function fetchLessonsContent() {
    if (!user?.sub || isLessonsLoading) return;
    
    try {
      setIsLessonsLoading(true);
      const contentResponse = await fetch(`/api/sections/Budget/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartData, user_id: user.sub }),
      });
      
      if (!contentResponse.ok) {
        throw new Error(`Lessons content failed: ${contentResponse.status}`);
      }
      
      const responseData = await contentResponse.json();
      
      if (responseData) {
        setSectionData(responseData);
        lessonsFetchedRef.current = true;
      } else {
        throw new Error(responseData.message || "Failed to fetch lessons data");
      }
    } catch (err) {
      console.error("Error fetching lessons data:", err);
      setLessonsError(err instanceof Error ? err.message : "An unknown error occurred loading lesson content");
    } finally {
      setIsLessonsLoading(false);
    }
  }
}