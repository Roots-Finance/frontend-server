import { FullLessonData, PortfolioPreferences, PortfolioRecommendation } from "@/components/dashboard/types";
import { CategoryData, DBUser, DBUserData } from "./types";

export interface DBResponse<T extends any> {
  status: 0 | 1; // 0 for failure, 1 for success
  error: 0 | 1; // 0 for no error, 1 for error
  message?: string;
  data: T;
  statusCode?: number;
  // [key: string]: any;
}

export interface NessiAccount {
  balance: number;
  id: string;
  nickname: string;
  rewards: number;
  type: string;
}

export interface NessiTransaction {
  // Define transaction properties based on your API
  id: string;
  amount: number;
  date: string;
  description: string;
  category?: string;
  [key: string]: any;
}

export interface UpdateUserRequest {
  oauth_sub: string;
  plaid_key?: string;
  knot_key?: string;
  first_name?: string;
  last_name?: string;
}

export class DBLib {
  private baseUrl: string;

  constructor() {
    // Get the backend URI from environment variables
    const backendUri = process.env.BACKEND_URI;

    if (!backendUri) {
      console.error("BACKEND_URI environment variable is not defined");
      this.baseUrl = "";
    } else {
      this.baseUrl = backendUri;
    }
  }

  /**
   * Makes a POST request to create/update a user
   * @param userData User data to send to the backend
   * @returns Promise with API response
   */
  async createUser(userData: DBUserData): Promise<DBUser> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = (await response.json()) as DBResponse<DBUser>;

    // Add statusCode to the response for internal tracking
    data.statusCode = response.status;

    return data.data;
  }

  /**
   * Gets user data by oauth_sub
   * @param oauthSub OAuth subject identifier
   * @returns Promise with API response containing user data
   */
  async getUserByOAuthSub(oauthSub: string): Promise<DBUser | null> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<DBUser>;

    // Add statusCode to the response for internal tracking
    data.statusCode = response.status;

    console.log(data);

    return data.data;
  }

  /**
   * Updates user data
   * @param updateData User data to update
   * @returns Promise with API response
   */
  async updateUser(updateData: UpdateUserRequest): Promise<DBResponse<DBUser>> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const data = (await response.json()) as DBResponse<DBUser>;

    // Add statusCode to the response for internal tracking
    data.statusCode = response.status;

    return data;
  }

  /**
   * Gets user accounts by oauth_sub
   * @param oauthSub OAuth subject identifier
   * @returns Promise with API response containing user accounts
   */
  async getUserAccounts(oauthSub: string): Promise<NessiAccount[]> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${oauthSub}/accounts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<NessiAccount[]>;

    // Add statusCode to the response for internal tracking if needed
    // data.statusCode = response.status;

    return data.data;
  }

  /**
   * Gets transactions for a specific account
   * @param accountId Account identifier
   * @returns Promise with API response containing account transactions
   */
  async getAccountTransactions(accountId: string): Promise<NessiTransaction[]> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/account/${accountId}/nessie-transactions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<NessiTransaction[]>;

    return data.data;
  }

  /**
   * Gets user budget by oauth_sub
   * @param oauthSub OAuth subject identifier
   * @returns Promise with API response containing user budget data
   */
  async getUserBudget(oauthSub: string): Promise<CategoryData | null> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/budget`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<CategoryData>;

    return data.data;
  }

   /**
   * Gets user budget by oauth_sub
   * @param oauthSub OAuth subject identifier
   * @returns Promise with API response containing user budget data
   */
   async getRecommendedCards(oauthSub: string): Promise<CategoryData | null> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}api/user/${oauthSub}/cards`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("here")
    console.log(`${this.baseUrl}api/user/${oauthSub}/cards`)
    const data = (await response.json()) as DBResponse<CategoryData>;

    return data.data;
  }

  

  /**
   * Updates user budget
   * @param oauthSub OAuth subject identifier
   * @param budgetData Budget data to update
   * @returns Promise with API response containing updated budget data
   */
  async updateUserBudget(oauthSub: string, budgetData: CategoryData): Promise<CategoryData> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/budget`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(budgetData),
    });

    const data = (await response.json()) as DBResponse<CategoryData>;

    return data.data;
  }

  async getAiUserBudgetInfo(oauthSub: string): Promise<CategoryData & { reasoning: string }> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/ai-budget`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<CategoryData & { reasoning: string }>;

    return data.data;
  }

  /**
   * Sends user portfolio data
   * @param portfolioPrefs Portfolio data to send
   * @returns Promise with API response
   */
  async sendUserPortfolio(oauthSub: string, portfolioPrefs: PortfolioPreferences): Promise<void> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/portfolio/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(portfolioPrefs),
    });

    const data = (await response.json()) as DBResponse<void>;

    // Add statusCode to the response for internal tracking
    data.statusCode = response.status;

    return data.data;
  }

  async getPortfolio(oauthSub: string): Promise<PortfolioRecommendation> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/portfolio`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<PortfolioRecommendation>;

    console.log(data);

    // Add statusCode to the response for internal tracking
    data.statusCode = response.status;

    return data.data;
  }

  async getSpyData(oauthSub: string, monthlySavings: number): Promise<{series: Record<string, number>}> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }
  
    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/spy_portfolio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        monthly_savings: monthlySavings
      }),
    });
  
    if (!response.ok) {
      throw new Error(`Failed to get SPY portfolio data: ${response.status}`);
    }
  
    const data = await response.json() as DBResponse<{series: Record<string, number>}>;
    return data.data;
  }

  async hasPortfolioPreferences(oauthSub: string): Promise<boolean> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/portfolio/preferences`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log('status', response.status)
      if (response.status === 404) {
        return false;
      }

      return response.status === 200;
    } catch (err) {
      console.error("Error checking portfolio preferences:", err);
      return false;
    }
  }

  async getAiGeneratedPortfolio(oauth_sub: string, monthly_savings: number): Promise<PortfolioRecommendation> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauth_sub)}/portfolio/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        monthly_savings: monthly_savings
      }),
    });

    console.log(response)
    const data = (await response.json()) as DBResponse<PortfolioRecommendation>;

    return data.data;
  }

  async getSPIPortfolio(oauth_sub: string, monthly_savings: number): Promise<PortfolioRecommendation> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauth_sub)}/portfolio/spi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        monthly_savings: monthly_savings
      }),
    });

    const data = (await response.json()) as DBResponse<PortfolioRecommendation>;

    return data.data;
  }

  /**
   * Gets AI-generated financial lessons for a user
   * @param oauthSub OAuth subject identifier
   * @returns Promise with API response containing user lessons grouped by status
   */
  async getAiLessons(oauthSub: string): Promise<FullLessonData> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/lessons`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<FullLessonData>;
    return data.data;
  }

  /**
   * Generic method to make API requests
   * @param endpoint API endpoint
   * @param method HTTP method
   * @param body Request body (optional)
   * @param headers Additional headers (optional)
   * @returns Promise with API response
   */
  async request<Resp, U = any>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    body?: U,
    headers: Record<string, string> = {}
  ): Promise<Resp> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = (await response.json()) as DBResponse<Resp>;

    // Add statusCode to the response for internal tracking
    data.statusCode = response.status;

    return data.data;
  }
}

// Create a singleton instance
export const apiService = new DBLib();

export default apiService;
