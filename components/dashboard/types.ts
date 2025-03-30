// Define content structure for the section content
export type ResourceType = 'Spreadsheet' | 'Tool' | 'PDF' | 'Video' | 'Article' | 'Data';

export type Section = 'Budgeting' | 'Stock Investments' | 'Cards' | 'Stock Trading' | null;

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
  
  export interface FullLessonData {
    title: string;
    description: string;
    lessons: Lesson[];
    resources: Resource[];
  }



  // app/components/dashboard/types/portfolio.ts

/**
 * Represents a trade in a user's trading history
 */
export interface TradeHistoryItem {
  date: string;
  symbol: string;
  transaction_type: 'buy' | 'sell';
  quantity: string;
  price: string;
  total: string;
}

/**
 * Represents a user's investment preferences and portfolio details
 */
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

/**
 * Represents a recommended portfolio allocation
 */
export interface PortfolioAllocation {
  [assetClass: string]: number; // Percentage allocation for each asset class
}

/**
 * Represents a portfolio recommendation with allocation and reasoning
 */
export interface PortfolioRecommendation {
  allocation: PortfolioAllocation;
  reasoning: string;
}

