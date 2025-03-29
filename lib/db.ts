import { DBUser, DBUserData } from "./types";

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

export interface BudgetData {
  [category: string]: number;
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

    console.log(data)

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
  async getUserBudget(oauthSub: string): Promise<BudgetData | null> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/budget`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<BudgetData>;

    return data.data;
  }

  /**
   * Updates user budget
   * @param oauthSub OAuth subject identifier
   * @param budgetData Budget data to update
   * @returns Promise with API response containing updated budget data
   */
  async updateUserBudget(oauthSub: string, budgetData: BudgetData): Promise<BudgetData> {
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

    const data = (await response.json()) as DBResponse<BudgetData>;

    return data.data;
  }

  async getAiUserBudgetInfo(oauthSub: string): Promise<BudgetData & {reasoning: string}> {
    if (!this.baseUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${this.baseUrl}/api/user/${encodeURIComponent(oauthSub)}/ai-budget`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as DBResponse<BudgetData & {reasoning: string}>;

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

    const url = `${this.baseUrl}${
      endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    }`;

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