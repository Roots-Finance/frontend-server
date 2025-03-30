"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Clock, 
  ExternalLink, 
  BookOpen, 
  FileText, 
  DollarSign, 
  RefreshCw,
  Loader2
} from "lucide-react";
import { TransactionChart, ChartLine } from "@/components/dashboard/charts/TransactionChart";
import { ExtendedUser } from "@/hooks/useDataUser";
import { Separator } from "@/components/ui/separator";
import { LessonViewer } from "@/components/dashboard/LessonViewer";
import { getResourceColor, getResourceIcon } from "./utils";
import InvestmentQuestionnairePopup from "../InvestmentQuestionnairePopup";
import { FullLessonData, Lesson, Resource, ResourceType } from "../types";
import { Toaster } from "@/components/ui/sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { PortfolioPreferences, TradeHistoryItem, PortfolioAllocation } from "./types/portfolio";
import { ITransaction } from "@/lib/types";

// Types
interface InvestmentSectionProps {
  user: ExtendedUser | null;
  userLoading: boolean;
  onBack: () => void;
}

interface PortfolioDataProps {
  [key: string]: number;
}


interface PortfolioPieChartProps {
  data: PortfolioDataProps;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

interface PortfolioControlsProps {
  onDiversify: () => void;
  onConsolidate: () => void;
  isLoading: boolean;
  loadingAction: string;
}

interface PortfolioAllocationProps {
  user: ExtendedUser | null;
  isLoading: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    value: number;
    name: string;
  }>;
}

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

interface CustomLegendProps {
  payload: Array<{
    color: string;
    value: string;
    payload: {
      name: string;
      value: number;
    };
  }>;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

interface InvestmentChartProps {
  chartData: ITransaction[];
  isChartLoading: boolean;
  chartError: string | null;
  lines: ChartLine[];
  resetChartData: () => void;
}

interface LessonsSectionProps {
  sectionData: FullLessonData | null;
  isLessonsLoading: boolean;
  lessonsError: string | null;
  completedLessons: string[];
  setActiveLesson: (lesson: Lesson) => void;
  retryFetchLessons: () => void;
}

interface ResourcesSectionProps {
  sectionData: FullLessonData | null;
  isLessonsLoading: boolean;
}

interface InvestmentProfile {
  riskTolerance: string;
  investmentGoals: string[];
  timeHorizon: string;
  existingInvestments: boolean;
  monthlyContribution: number;
  completed?: boolean;
}

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
const PortfolioPieChart = ({ data, activeIndex, setActiveIndex }: PortfolioPieChartProps): React.ReactElement => {
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
            activeIndex={activeIndex}
            activeShape={RenderActiveShape}
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

// Portfolio Control Buttons Component
const PortfolioControls = ({ onDiversify, onConsolidate, isLoading, loadingAction }: PortfolioControlsProps): React.ReactElement => {
  return (
    <div className="flex flex-col h-full justify-center space-y-6 p-4">
      <Button 
        onClick={onDiversify} 
        className="w-full"
        variant="outline"
        disabled={isLoading}
      >
        {isLoading && loadingAction === 'diversify' ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Diversifying...
          </>
        ) : 'Diversify'}
      </Button>
      <Button 
        onClick={onConsolidate} 
        className="w-full"
        variant="outline"
        disabled={isLoading}
      >
        {isLoading && loadingAction === 'consolidate' ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Consolidating...
          </>
        ) : 'Consolidate'}
      </Button>
    </div>
  );
};

// Portfolio Allocation Manager Component
const PortfolioAllocationManager = ({ user, isLoading }: PortfolioAllocationProps): React.ReactElement => {
  // Portfolio data state
  const [portfolioData, setPortfolioData] = useState<PortfolioDataProps>({});
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string>('');

  // Load user's portfolio data when component mounts
  useEffect(() => {
    if (user?.sub) {
      fetchPortfolioData(user.sub);
    }
  }, [user?.sub]);

  // Fetch portfolio allocation from API
  const fetchPortfolioData = async (userId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/sections/Investment/categories?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error(`Failed to fetch portfolio data: ${response.status}`);
      
      const data = await response.json() as PortfolioDataProps;
      setPortfolioData(data);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // Set fallback data if needed
      setPortfolioData({
        "US Stocks": 45,
        "International Stocks": 25,
        "Bonds": 15,
        "Real Estate": 10,
        "Cash": 5
      });
    }
  };

  // Handler for the Diversify button
  const handleDiversify = async (): Promise<void> => {
    if (!user?.sub) return;
    
    setIsPortfolioLoading(true);
    setLoadingAction('diversify');
    
    try {
      // Call AI portfolio endpoint
      const response = await fetch(`/api/user/${user.sub}/ai-portfolio`);
      if (!response.ok) throw new Error(`Failed to diversify portfolio: ${response.status}`);
      
      const result = await response.json();
      
      if (result.status === 1 && result.data) {
        // Remove any non-allocation fields like 'reasoning'
        const newPortfolio = { ...result.data };
        delete newPortfolio.reasoning;
        
        setPortfolioData(newPortfolio);
        
        // Save the updated portfolio
        await savePortfolioData(user.sub, newPortfolio);
      }
    } catch (error) {
      console.error('Error diversifying portfolio:', error);
    } finally {
      setIsPortfolioLoading(false);
      setLoadingAction('');
    }
  };

  // Handler for the Consolidate button
  const handleConsolidate = async (): Promise<void> => {
    if (!user?.sub) return;
    
    setIsPortfolioLoading(true);
    setLoadingAction('consolidate');
    
    try {
      // This could be a separate API endpoint in a real app
      // For now, we'll use a predefined consolidated portfolio
      const consolidatedPortfolio: PortfolioDataProps = {
        "US Stocks": 60,
        "International Stocks": 20,
        "Bonds": 15,
        "Cash": 5
      };
      
      setPortfolioData(consolidatedPortfolio);
      
      // Save the updated portfolio
      await savePortfolioData(user.sub, consolidatedPortfolio);
    } catch (error) {
      console.error('Error consolidating portfolio:', error);
    } finally {
      setIsPortfolioLoading(false);
      setLoadingAction('');
    }
  };

  // Save portfolio data to API
  const savePortfolioData = async (userId: string, portfolio: PortfolioDataProps): Promise<void> => {
    try {
      const response = await fetch('/api/sections/Investment/set-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, portfolio }),
      });
      
      if (!response.ok) throw new Error(`Failed to save portfolio: ${response.status}`);
    } catch (error) {
      console.error('Error saving portfolio data:', error);
    }
  };

  return (
    <Card className="border bg-background">
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
        <CardDescription>
          Asset allocation breakdown with management controls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 relative">
            {(isLoading || isPortfolioLoading) && (
              <div className="absolute inset-0 bg-card/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                <div className="flex flex-col items-center bg-card p-4 rounded-lg shadow-lg border">
                  <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                  <p className="text-sm font-medium">
                    {isPortfolioLoading 
                      ? loadingAction === 'diversify' 
                        ? 'Diversifying your portfolio...' 
                        : 'Consolidating your portfolio...'
                      : 'Loading portfolio data...'}
                  </p>
                </div>
              </div>
            )}
            <PortfolioPieChart 
              data={portfolioData} 
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          </div>
          
          <div className="mx-4 my-6 md:my-0">
            <Separator orientation="vertical" className="h-[200px]" />
          </div>
          
          <div className="w-2/5 text-center">
            <h1 className="text-2xl font-bold">Investment Wizard</h1>
            <PortfolioControls 
              onDiversify={handleDiversify} 
              onConsolidate={handleConsolidate}
              isLoading={isPortfolioLoading}
              loadingAction={loadingAction}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Lessons Section Component
const LessonsSection = ({ 
  sectionData, 
  isLessonsLoading, 
  lessonsError, 
  completedLessons, 
  setActiveLesson, 
  retryFetchLessons 
}: LessonsSectionProps): React.ReactElement => {
  return (
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
          <Button onClick={retryFetchLessons} variant="outline" size="sm">
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
  );
};

// Resources Section Component
const ResourcesSection = ({ sectionData, isLessonsLoading }: ResourcesSectionProps): React.ReactElement => {
  return (
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
  );
};

// Chart Component
const InvestmentChart = ({ 
  chartData, 
  isChartLoading, 
  chartError, 
  lines, 
  resetChartData 
}: InvestmentChartProps): React.ReactElement => {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Investment Portfolio Performance</CardTitle>
        <CardDescription>Track your investment growth over time</CardDescription>
      </CardHeader>
      <CardContent>
        {isChartLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-sm text-muted-foreground">Analyzing your investment data...</p>
            </div>
          </div>
        ) : chartError ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">{chartError}</p>
            <Button onClick={resetChartData} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : (
          <TransactionChart title="" description="" data={chartData} lines={lines} />
        )}
      </CardContent>
    </Card>
  );
};

// Main Investment Section Component
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
  
  // Check if user has already completed the questionnaire
  useEffect(() => {
    const checkQuestionnaireStatus = async (): Promise<void> => {
      if (!user?.sub || userLoading) return;
      
      try {
        const response = await fetch(`/api/user/${user.sub}/investment-profile`);
        if (!response.ok) {
          setIsQuestionnaireOpen(true);
          return;
        }
        
        const profile = await response.json() as InvestmentProfile;
        setHasCompletedQuestionnaire(!!profile.completed);
        
        if (!profile.completed) {
          setIsQuestionnaireOpen(true);
        }
      } catch (error) {
        console.error("Error checking questionnaire status:", error);
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
          // Process transactions to create chart data
          const processedData: ITransaction[] = user.data.transactions.map(tx => ({
            date: tx.date,
            value: tx.amount
          }));
          
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

  const handleQuestionnaireComplete = async (data: InvestmentProfile): Promise<void> => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/user/${user.sub}/investment-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
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
    window.location.reload();
  };

  const retryFetchLessons = (): void => {
    lessonsFetchedRef.current = false;
    setLessonsError(null);
    setIsLessonsLoading(true);
    fetchLessonsContent();
  };

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
        preventOutsideClose={false}
      />
      
      <Toaster />
    </div>
  );