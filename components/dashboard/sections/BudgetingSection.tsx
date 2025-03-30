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
import { ITransaction } from "@/lib/types";
import { minimizeBudgetProjection } from "@/lib/sections/budget";
import { ResourceType } from "../types";
import { Toaster } from "@/components/ui/sonner";

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
}

interface BudgetData {
  [category: string]: number;
}

interface BudgetingSectionProps {
  user: ExtendedUser | null;
  userLoading: boolean;
  onBack: () => void;
}

/** Updated props for the sliders card to include savings information. */
interface CategorySlidersCardProps {
  uniqueCategories: string[];
  categorySliders: BudgetData;
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
  const dataFetchedRef = useRef(false);
  const transactionIdsRef = useRef<string[]>([]);

  const [chartData, setChartData] = useState<ITransaction[]>([]);
  const [sectionData, setSectionData] = useState<BudgetingSectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const [categorySliders, setCategorySliders] = useState<BudgetData>({});
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [userBudget, setUserBudget] = useState<BudgetData | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>("");
  const [spendingData, setSpendingData] = useState<{ [category: string]: number }>({});

  // Initial load for default categories
  useEffect(() => {
    const loadDefaultCategories = async () => {
      if (!user?.sub) return;
      try {
        const response = await fetch(`/api/sections/Budget/categories?userId=${encodeURIComponent(user.sub)}`);
        if (!response.ok) throw new Error(`Failed to fetch default categories: ${response.status}`);
        const data = await response.json() as BudgetData | null;
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

  // Fetch chart data and section content
  useEffect(() => {
    const fetchBudgetData = async () => {
      if (!user || !user.data || userLoading || isLoading) return;
      const currentTxIds = user.data.transactions.map(t => t.transaction_id).sort().join(",");
      if (
        transactionIdsRef.current.length > 0 &&
        currentTxIds === transactionIdsRef.current.join(",") &&
        chartData.length &&
        sectionData
      ) {
        return;
      }
      transactionIdsRef.current = currentTxIds.split(",");
      try {
        setIsLoading(true);
        const projectionData = minimizeBudgetProjection(user.data.transactions, {});
        setChartData(projectionData);
        const contentResponse = await fetch("/api/sections/Budget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartData: projectionData }),
        });
        if (!contentResponse.ok) throw new Error(`Section content failed: ${contentResponse.status}`);
        const contentData = await contentResponse.json();
        setSectionData(contentData);
        dataFetchedRef.current = true;
      } catch (err) {
        console.error("Error fetching budget data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (!dataFetchedRef.current) {
      fetchBudgetData();
    }
  }, [user, userLoading, isLoading, chartData.length, sectionData]);

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
      const aiData = await response.json() as BudgetData & { reasoning?: string };
      setUserBudget(aiData);
      setCategorySliders(aiData);
      setAiReasoning(aiData.reasoning || "");
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
      const updatedBudget = await response.json() as BudgetData;
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

  if (!earliest || !latest) {
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

  const months = (latest.getFullYear() - earliest.getFullYear()) * 12 + latest.getMonth() - earliest.getMonth() + 1;
  const perMonthSaving = totalSavings / months;

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
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Analyzing your spending patterns...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center mb-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle className="text-red-600">Error Loading Budget Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <TransactionChart title="" description="" data={chartData} lines={lines} />
        </CardContent>
      </Card>

      {/* Sliders Card with embedded Total Savings Display */}
      {uniqueCategories.length > 0 && (
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

      {/* Budget Content Card */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionData?.lessons?.map((lesson) => {
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
              })}
            </div>
          </div>
          {sectionData?.resources?.length ? (
            <div>
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Helpful Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sectionData.resources.map((resource) => (
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
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
