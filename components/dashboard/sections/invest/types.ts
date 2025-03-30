// app/components/dashboard/investment/types/index.ts
import { ExtendedUser } from "@/hooks/useDataUser";
import { FullLessonData, Lesson } from "@/components/dashboard/types";
import { ChartLine } from "@/components/dashboard/charts/TransactionChart";
import { ITransaction } from "@/lib/types";

export interface InvestmentSectionProps {
  user: ExtendedUser | null;
  userLoading: boolean;
  onBack: () => void;
}


// Interface for portfolio data
export interface PortfolioDataProps {
  [key: string]: number;
}

// Props for the PortfolioAllocationManager component
export interface PortfolioAllocationProps {
  user: {
    sub: string;
    [key: string]: any;
  } | null;
  isLoading: boolean;
  portfolioData?: PortfolioDataProps;
}

// Props for the PortfolioPieChart component
export interface PortfolioPieChartProps {
  data: PortfolioDataProps;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

// Props for the PortfolioControls component
export interface PortfolioControlsProps {
  onDiversify: () => Promise<void>;
  onConsolidate: () => Promise<void>;
  isLoading: boolean;
  loadingAction: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    value: number;
    name: string;
  }>;
}

export interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

export interface CustomLegendProps {
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

export interface InvestmentChartProps {
  chartData: ITransaction[];
  isChartLoading: boolean;
  chartError: string | null;
  lines: ChartLine[];
  resetChartData: () => void;
}

export interface LessonsSectionProps {
  sectionData: FullLessonData | null;
  isLessonsLoading: boolean;
  lessonsError: string | null;
  completedLessons: string[];
  setActiveLesson: (lesson: Lesson) => void;
  retryFetchLessons: () => void;
}

export interface ResourcesSectionProps {
  sectionData: FullLessonData | null;
  isLessonsLoading: boolean;
}

// export interface InvestmentProfile {
//   riskTolerance: string;
//   investmentGoals: string[];
//   timeHorizon: string;
//   existingInvestments: boolean;
//   monthlyContribution: number;
//   completed?: boolean;
// }


// Define Portfolio Preferences
export interface PortfolioPreferences {
    // Investment experience
    is_experienced_investor: boolean;
    
    // Sector preferences
    preferred_sectors: string[];
    sector_preference_rankings: string[];
    
    // Specific sector interests
    tech_sector_interest: boolean;
    healthcare_sector_interest: boolean;
    financial_sector_interest: boolean;
    energy_sector_interest: boolean;
    consumer_goods_interest: boolean;
    industrials_interest: boolean;
    
    // Market and company size preferences
    market_cap_preference: 'small-cap' | 'mid-cap' | 'large-cap' | 'multi-cap';
    small_cap_interest: boolean;
    blue_chip_interest: boolean;
    
    // Investment style preferences
    growth_vs_value: 'growth' | 'value' | 'blend';
    dividend_preference: boolean;
    cyclical_vs_defensive: 'cyclical' | 'defensive' | 'mixed';
    
    // Geographic preferences
    emerging_markets_interest: boolean;
    
    // ESG considerations
    ESG_preference: boolean;
    
    // Subsector interests
    tech_subsectors_interest: string[];
    healthcare_subsectors_interest: string[];
    
    // Investment parameters
    investment_time_horizon: number; // in years
    valuation_metrics_preference: string;
    
    // Trading history
    has_trade_history: boolean;
    trade_history_data?: TradeHistoryItem[];
  }

export interface InvestmentQuestionnairePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PortfolioPreferences) => void;
  preventOutsideClose: boolean;
}

// Define Trade History
export interface TradeHistoryItem {
  date: string;
  symbol: string;
  transaction_type: 'buy' | 'sell';
  quantity: string;
  price: string;
  total: string;
}
