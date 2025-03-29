// lib/nessi.ts (updated)

/**
 * ApiService - Handles API requests to backend
 */
export interface UserData {
  oauth_sub: string;
  first_name: string;
  last_name: string;
}

export interface User {
  first_name: string;
  last_name: string;
  plaid_access_token: string | null;
  knot_access_token: string | null;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  status: 0 | 1; // 0 for failure, 1 for success
  error: 0 | 1; // 0 for no error, 1 for error
  message?: string;
  user?: User;
  statusCode?: number;
  [key: string]: any;
}

export class ApiService {
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
  async createUser(userData: UserData): Promise<ApiResponse> {
    try {
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

      const data = (await response.json()) as ApiResponse;

      // Add statusCode to the response for internal tracking
      data.statusCode = response.status;

      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      // Return a formatted error response matching the expected structure
      return {
        status: 0,
        error: 1,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      };
    }
  }

  /**
   * Gets user data by oauth_sub
   * @param oauthSub OAuth subject identifier
   * @returns Promise with API response containing user data
   */
  async getUserByOAuthSub(oauthSub: string): Promise<ApiResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error("Backend URL is not configured");
      }

      const response = await fetch(`${this.baseUrl}/api/user/${oauthSub}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as ApiResponse;

      // Add statusCode to the response for internal tracking
      data.statusCode = response.status;

      return data;
    } catch (error) {
      console.error("Error getting user:", error);
      return {
        status: 0,
        error: 1,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      };
    }
  }

  /**
   * Generic method to make API requests
   * @param endpoint API endpoint
   * @param method HTTP method
   * @param body Request body (optional)
   * @param headers Additional headers (optional)
   * @returns Promise with API response
   */
  async request<U = any>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: U,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse> {
    try {
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

      if (body && (method === "POST" || method === "PUT")) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      let data: ApiResponse;

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = (await response.json()) as ApiResponse;
      } else {
        // Handle non-JSON responses
        const textResponse = await response.text();
        data = {
          status: response.ok ? 1 : 0,
          error: response.ok ? 0 : 1,
          message: textResponse || response.statusText,
        };
      }

      // Add statusCode to the response for internal tracking
      data.statusCode = response.status;

      return data;
    } catch (error) {
      console.error(`Error making ${method} request to ${endpoint}:`, error);
      return {
        status: 0,
        error: 1,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
      };
    }
  }
}

// Create a singleton instance
export const apiService = new ApiService();

export default apiService;