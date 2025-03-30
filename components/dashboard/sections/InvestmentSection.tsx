// app/components/dashboard/investment/InvestmentSection.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { TransactionChart, ChartLine } from "@/components/dashboard/charts/TransactionChart";
import { ExtendedUser } from "@/hooks/useDataUser";
import { LessonViewer } from "@/components/dashboard/LessonViewer";
import { FullLessonData, Lesson } from "@/components/dashboard/types";
import { Toaster } from "@/components/ui/sonner";

// Import components
import PortfolioAllocationManager from "./invest/PortfolioAllocationManager";
import PortfolioComparison from "./invest/PortfolioComparison";
import InvestmentChart from "./invest/InvestmentChart";
import LessonsSection from "./invest/LessonsSection";
import ResourcesSection from "./invest/ResourcesSection";
import InvestmentQuestionnairePopup from "./invest/QuestionnairePopup";

// Import types
import { InvestmentSectionProps, PortfolioPreferences } from "./invest/types";
import { ITransaction, CategoryData } from "@/lib/types";

// Import utility functions for processing chart data
import { minimizeBudgetProjection } from "@/lib/sections/budget";
import { calculateInvestmentValue } from "@/lib/dataProcessing";

/**
 * Main component for the Investment Section of the dashboard
 */
export function InvestmentSection({ user, userLoading, onBack }: InvestmentSectionProps): React.ReactElement {
  const chartDataFetchedRef = useRef<boolean>(false);
  const lessonsFetchedRef = useRef<boolean>(false);

  const [chartData, setChartData] = useState<ITransaction[]>([]);
  const [sectionData, setSectionData] = useState<FullLessonData | null>(null);
  
  // Loading states
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [isLessonsLoading, setIsLessonsLoading] = useState<boolean>(false);
  
  // Error states
  const [chartError, setChartError] = useState<string | null>(null);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  
  // Questionnaire states
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState<boolean>(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState<boolean>(false);

  // Category settings state for chart data processing
  const [categorySettings, setCategorySettings] = useState<CategoryData | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(false);

  // Monthly payment state for SPI portfolio
  const [monthlyPayment, setMonthlyPayment] = useState<number>(500);

  // AI Portfolio state
  const [showAIPortfolio, setShowAIPortfolio] = useState<boolean>(false);
  const [aiPortfolioData, setAIPortfolioData] = useState<{
    allocations: Record<string, number>;
    reasoning: string;
    series: Record<string, number>;
  } | null>(null);
  const [isAIPortfolioLoading, setIsAIPortfolioLoading] = useState<boolean>(false);
  const [aiPortfolioError, setAIPortfolioError] = useState<string | null>(null);

  // Check if user has already completed the questionnaire
  useEffect(() => {
    const checkQuestionnaireStatus = async (): Promise<void> => {
      if (!user?.sub || userLoading) return;
      
      try {
        const response = await fetch(`/api/sections/Investment/preferences?userId=${user.sub}`);
        if (!response.ok) {
          console.log("Questionnaire status check failed:", await response.text());
          setIsQuestionnaireOpen(true);
          return;
        }
        const result = await response.json();
        if (result) {
          setHasCompletedQuestionnaire(true);
        } else {
          setIsQuestionnaireOpen(true);
        }
      } catch (error) {
        console.error("Error checking questionnaire status:", error);
        setIsQuestionnaireOpen(true);
      }
    };
    checkQuestionnaireStatus();
  }, [user?.sub, userLoading]);

  // Fetch category settings
  useEffect(() => {
    const fetchCategorySettings = async () => {
      if (!user?.sub) return;
      try {
        setIsSettingsLoading(true);
        const response = await fetch(`/api/sections/Budget/categories?userId=${encodeURIComponent(user.sub)}`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
        const data = await response.json() as CategoryData | null;
        setCategorySettings(data || {});
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategorySettings({});
      } finally {
        setIsSettingsLoading(false);
      }
    };
    if (user?.sub && !categorySettings) {
      fetchCategorySettings();
    }
  }, [user?.sub, categorySettings]);

  // Load chart data from user data
  useEffect(() => {
    const fetchChartData = async (): Promise<void> => {
      if (!user || userLoading || isChartLoading || !user.data || isSettingsLoading || !categorySettings) return;
      try {
        setIsChartLoading(true);
        // Generate projection data using the category settings
        const projectionData = minimizeBudgetProjection(user.data.transactions, categorySettings);
        // Calculate cumulative investment value using the utility function
        const enhancedData = calculateInvestmentValue(projectionData);
        setChartData(enhancedData);
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
  }, [user, userLoading, isChartLoading, isSettingsLoading, categorySettings]);

  // Calculate monthly payment from user's transactions
  useEffect(() => {
    if (!user || !user.data || !user.data.transactions) return;
    
    // Calculate average monthly savings as the average of positive transactions over the last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const recentSavings = user.data.transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= threeMonthsAgo && tx.amount > 0;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    // Calculate average monthly savings (at least $100)
    const avgMonthlySavings = Math.max(Math.round(recentSavings / 3), 100);
    setMonthlyPayment(avgMonthlySavings);
  }, [user]);

  // Fetch lessons content
  useEffect(() => {
    if (!lessonsFetchedRef.current && user?.sub) {
      fetchLessonsContent();
    }
  }, [user?.sub]);

  // When AI Portfolio overlay is enabled, calculate monthly savings and fetch AI portfolio data.
  useEffect(() => {
    if (!showAIPortfolio || !user || !user.data) return;

    const fetchAIPortfolio = async () => {
      try {
        setIsAIPortfolioLoading(true);
        setAIPortfolioError(null);
        // Calculate monthly savings as the sum of positive transactions in the current month.
        const now = new Date();
        const monthlySavings = user.data.transactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth() && tx.amount > 0;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        const response = await fetch("/api/sections/Investment/ai-portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.sub, monthly_savings: monthlySavings })
        });
        if (!response.ok) throw new Error(`Failed to fetch AI portfolio: ${response.status}`);
        const data = await response.json();
        setAIPortfolioData(data);
      } catch (err) {
        console.error("Error fetching AI portfolio data:", err);
        setAIPortfolioError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsAIPortfolioLoading(false);
      }
    };

    fetchAIPortfolio();
  }, [showAIPortfolio, user]);

  const handleQuestionnaireComplete = async (data: PortfolioPreferences): Promise<void> => {
    if (!user?.sub) return;
    try {
      const response = await fetch(`/api/sections/Investment/set-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.sub, portfolio: data })
      });
      if (!response.ok) throw new Error('Failed to save investment profile');
      setHasCompletedQuestionnaire(true);
      setIsQuestionnaireOpen(false);
    } catch (error) {
      console.error('Error saving investment profile:', error);
    }
  };
  
  const handleQuestionnaireClose = (): void => {
    setIsQuestionnaireOpen(false);
  };

  const resetChartData = (): void => {
    chartDataFetchedRef.current = false;
    setChartError(null);
    (async () => {
      await (async function fetchChartDataAgain(): Promise<void> {
        if (!user || userLoading || isChartLoading || !user.data || isSettingsLoading || !categorySettings) return;
        try {
          setIsChartLoading(true);
          const projectionData = minimizeBudgetProjection(user.data.transactions, categorySettings);
          const enhancedData = calculateInvestmentValue(projectionData);
          setChartData(enhancedData);
          chartDataFetchedRef.current = true;
        } catch (err) {
          console.error("Error generating chart data:", err);
          setChartError(err instanceof Error ? err.message : "An unknown error occurred generating chart data");
        } finally {
          setIsChartLoading(false);
        }
      })();
    })();
  };

  const retryFetchLessons = (): void => {
    lessonsFetchedRef.current = false;
    setLessonsError(null);
    setIsLessonsLoading(true);
    fetchLessonsContent();
  };

  // Helper function for fetching lessons content
  async function fetchLessonsContent(): Promise<void> {
    if (!user?.sub || isLessonsLoading) return;
    try {
      setIsLessonsLoading(true);
      const contentResponse = await fetch(`/api/sections/Investment/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartData, user_id: user.sub }),
      });
      if (!contentResponse.ok) {
        throw new Error(`Lessons content failed: ${contentResponse.status}`);
      }
      const responseData = await contentResponse.json() as FullLessonData;
      if (responseData) {
        setSectionData(responseData);
        lessonsFetchedRef.current = true;
      } else {
        throw new Error("Failed to fetch lessons data");
      }
    } catch (err) {
      console.error("Error fetching lessons data:", err);
      setLessonsError(err instanceof Error ? err.message : "An unknown error occurred loading lesson content");
    } finally {
      setIsLessonsLoading(false);
    }
  }

  // Compute combined chart data if AI Portfolio overlay is enabled.
  // For each date in the AI series, we try to find a matching transaction value.
  // If none exists, we take the value from the closest previous transaction.
  const combinedChartData = useMemo(() => {
    if (!showAIPortfolio || !aiPortfolioData?.series) return [];
    const aiDates = Object.keys(aiPortfolioData.series).sort();
    return aiDates.map((date) => {
      // Find a matching transaction or use the closest previous transaction value.
      const date1 = new Date(date);
      const matchingTx = chartData.find(tx => tx.date.getTime() === date1.getTime());
      let baseValue: number | undefined = matchingTx ? matchingTx.totalValue : undefined;
      if (baseValue === undefined) {
        const previousTxs = chartData.filter(tx => tx.date < date1);
        if (previousTxs.length > 0) {
          baseValue = previousTxs.sort((a, b) => (a.date > b.date ? -1 : 1))[0].totalValue;
        }
      }
      // does every value have totalValue?
      if (baseValue === undefined) baseValue = 0;
      return {
        date,
        totalValue: baseValue,
        aiTotalValue: aiPortfolioData.series[date]
      };
    });
  }, [showAIPortfolio, aiPortfolioData, chartData]);

  // Determine which data to pass to the chart and which lines to render.
  const chartDisplayData = showAIPortfolio ? combinedChartData : chartData;
  const lines: ChartLine[] = showAIPortfolio
    ? [
      {
        dataKey: "aiTotalValue",
        name: "AI Portfolio Growth",
        color: "#f59e0b",
        type: "area",
        strokeWidth: 2,
        dot: false,
      },
        {
          dataKey: "totalValue",
          name: "Investment Growth",
          color: "#10b981",
          type: "area",
          strokeWidth: 2,
          dot: false,
        },

      ]
    : [
        {
          dataKey: "totalValue",
          name: "Investment Growth",
          color: "#10b981",
          type: "area",
          strokeWidth: 2,
          dot: false,
        }
      ];

  // No user data - render a basic message
  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center mb-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <CardTitle>Investment</CardTitle>
            <CardDescription>No user data available</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {activeLesson && (
        <LessonViewer
          lesson={activeLesson}
          chartData={chartDisplayData}
          lines={lines}
          onClose={() => setActiveLesson(null)}
          onComplete={(lessonId: string) => {
            setCompletedLessons(prev => [...prev, lessonId]);
            setActiveLesson(null);
          }}
        />
      )}

      {/* The main content - conditionally blurred */}
      <div className={!hasCompletedQuestionnaire && !isQuestionnaireOpen ? "filter blur-sm pointer-events-none" : ""}>
        {/* Page Navigation */}
        <Card className="border shadow-sm mb-6">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" className="w-24 flex items-center justify-center" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Reset Data
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAIPortfolio(prev => !prev)}>
                  AI Portfolio
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Investment Chart */}
        <TransactionChart 
          data={chartDisplayData}
          useDefaultLine={false}
          title="Investment Growth"
          description="Track the cumulative value of your investments over time"
          lines={lines}
        />

        {/* If AI Portfolio overlay is active, show the reasoning text or a loading/error indicator */}
        {showAIPortfolio && (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">AI Portfolio Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              {isAIPortfolioLoading ? (
                <CardDescription className="text-base">Loading AI Portfolio data...</CardDescription>
              ) : aiPortfolioError ? (
                <CardDescription className="text-base text-red-600">{aiPortfolioError}</CardDescription>
              ) : (
                <CardDescription className="text-base">
                  {aiPortfolioData?.reasoning}
                </CardDescription>
              )}
            </CardContent>
          </Card>
        )}

       

        {/* Portfolio Comparison */}
        {!isChartLoading && !chartError && (
          <PortfolioComparison 
            user={user}
            monthlyPayment={monthlyPayment}
          />
        )}

        {/* Investment Lessons & Resources Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {sectionData?.title || "Investment Fundamentals"}
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              {sectionData?.description ||
                "Learn how to build and manage an investment portfolio to grow your wealth."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Lessons Section */}
            <LessonsSection
              sectionData={sectionData}
              isLessonsLoading={isLessonsLoading}
              lessonsError={lessonsError}
              completedLessons={completedLessons}
              setActiveLesson={setActiveLesson}
              retryFetchLessons={retryFetchLessons}
            />
            
            {/* Resources Section */}
            <ResourcesSection
              sectionData={sectionData}
              isLessonsLoading={isLessonsLoading}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Overlay when questionnaire is not completed */}
      {!hasCompletedQuestionnaire && !isQuestionnaireOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div className="bg-background rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h2 className="text-xl font-bold mb-3">Complete Your Investment Profile</h2>
            <p className="mb-4 text-muted-foreground">
              Please complete the investment questionnaire to get personalized investment recommendations.
            </p>
            <Button
              onClick={() => setIsQuestionnaireOpen(true)}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Take Investment Questionnaire
            </Button>
          </div>
        </div>
      )}
      
      {/* The questionnaire popup */}
      <InvestmentQuestionnairePopup 
        isOpen={isQuestionnaireOpen}
        onClose={handleQuestionnaireClose}
        onSubmit={handleQuestionnaireComplete}
        preventOutsideClose={!hasCompletedQuestionnaire}
      />
      
      <Toaster />
    </div>
  );
}