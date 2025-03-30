// app/components/dashboard/investment/InvestmentSection.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
import InvestmentChart from "./invest/InvestmentChart";
import LessonsSection from "./invest/LessonsSection";
import ResourcesSection from "./invest/ResourcesSection";
import InvestmentQuestionnairePopup from "./invest/QuestionnairePopup";

// Import types
import { 
  InvestmentSectionProps, 
  ChartDataPoint, 
  InvestmentProfile,
  PortfolioPreferences
} from "./invest/types";
import { ITransaction } from "@/lib/types";

/**
 * Main component for the Investment Section of the dashboard
 */
export function InvestmentSection({ 
  user, 
  userLoading, 
  onBack 
}: InvestmentSectionProps): React.ReactElement {
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
  
  // Check if user has already completed the questionnaire
  useEffect(() => {
    const checkQuestionnaireStatus = async (): Promise<void> => {
      if (!user?.sub || userLoading) return;
      
      try {
        const response = await fetch(`/api/sections/Investment/preferences?userId=${user.sub}`);

        if (!response.ok) {
          console.log("Questionnaire status check failed:", await response.text());
          // If 404 or other error, user hasn't completed the questionnaire
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
        // If error, default to showing the questionnaire
        setIsQuestionnaireOpen(true);
      }
    };
    
    checkQuestionnaireStatus();
  }, [user?.sub, userLoading]);

  // Load chart data from user data
  useEffect(() => {
    const fetchChartData = async (): Promise<void> => {
      if (!user || userLoading || isChartLoading || !user.data) return;
      
      try {
        setIsChartLoading(true);
        
        // Use transaction data from useDataUser hook
        if (user.data.transactions) {
          // process transactions by date (should be sorted already)

          let totalValue = 0;
          const processedData: ITransaction[] = user.data.transactions.map(tx => {
            totalValue += tx.amount;
            return {
              ...tx,
              value: totalValue
            };
          });
          
          
          
          setChartData(processedData);
        }
        
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
  }, [user, userLoading, isChartLoading]);

  // Fetch lessons content
  useEffect(() => {
    if (!lessonsFetchedRef.current && user?.sub) {
      fetchLessonsContent();
    }
  }, [user?.sub]);

  const handleQuestionnaireComplete = async (data: PortfolioPreferences): Promise<void> => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/sections/Investment/set-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.sub, portfolio: data})
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
    fetchChartData();
  };

  const retryFetchLessons = (): void => {
    lessonsFetchedRef.current = false;
    setLessonsError(null);
    setIsLessonsLoading(true);
    fetchLessonsContent();
  };

  const fetchChartData = async (): Promise<void> => {
    if (!user || userLoading || !user.data) return;
    
    try {
      setIsChartLoading(true);
      
      // Use transaction data from useDataUser hook
      if (user.data.transactions) {
        // Process transactions to create chart data - simplified for brevity
       
        let totalValue = 0;
        const processedData: ITransaction[] = user.data.transactions.map(tx => {
          totalValue += tx.amount;
          return {
            ...tx,
            value: totalValue
          };
        });
        
        setChartData(processedData);
      }
      
      chartDataFetchedRef.current = true;
    } catch (err) {
      console.error("Error generating chart data:", err);
      setChartError(err instanceof Error ? err.message : "An unknown error occurred generating chart data");
    } finally {
      setIsChartLoading(false);
    }
  };

  // Chart line configuration
  const lines: ChartLine[] = [
    {
      dataKey: "value",
      name: "Portfolio Value",
      color: "#3182CE",
      type: "area",
      strokeWidth: 2,
      dot: false,
    },
  ];

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
          chartData={chartData}
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
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Reset Data
              </Button>
            </div>
          </CardHeader>
        </Card>
        
        {/* Investment Chart Card */}
        <InvestmentChart 
          chartData={chartData}
          isChartLoading={isChartLoading}
          chartError={chartError}
          lines={lines}
          resetChartData={resetChartData}
        />

        {/* Portfolio Allocation Manager */}
        {!isChartLoading && !chartError && (
          <PortfolioAllocationManager user={user} isLoading={isChartLoading} />
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

export default InvestmentSection;