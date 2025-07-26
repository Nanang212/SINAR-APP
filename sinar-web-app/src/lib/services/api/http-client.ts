// Use Vite's import.meta.env for runtime environment variables

export interface ApiResponse<T = any> {
  status: boolean;
  code: number;
  message: string;
  data?: T;
  error?: string;
}

export interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

class HttpClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    // Use Vite's import.meta.env for runtime environment variables
    this.baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000");
  }

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.timeout,
    } = config;

    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestConfig: RequestInit = {
        method,
        headers: defaultHeaders,
        signal: controller.signal,
        ...(body && { body: JSON.stringify(body) }),
      };

      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401) {
          // Token expired or invalid - clear stored token
          this.clearAuthToken();

          // Redirect to login if not already there
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/login")
          ) {
            window.location.href = "/login";
          }
        }

        return {
          status: false,
          code: response.status,
          message: responseData?.message || "Request failed",
          error: responseData?.message || responseData || "Request failed",
        };
      }

      // Handle backend response format
      if (
        responseData &&
        typeof responseData === "object" &&
        "status" in responseData
      ) {
        return {
          status: responseData.status,
          code: responseData.code || response.status,
          message: responseData.message || "Success",
          data: responseData.data,
        };
      }

      return {
        status: true,
        code: response.status,
        message: "Success",
        data: responseData,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            status: false,
            code: 408,
            message: "Request timeout",
            error: "Request timeout",
          };
        }

        return {
          status: false,
          code: 0,
          message: error.message,
          error: error.message,
        };
      }

      return {
        status: false,
        code: 0,
        message: "Unknown error occurred",
        error: "Unknown error occurred",
      };
    }
  }

  async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const config: RequestConfig = { method: "GET" };
    if (headers) {
      config.headers = headers;
    }
    return this.makeRequest<T>(endpoint, config);
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const config: RequestConfig = { method: "POST" };
    if (body !== undefined) {
      config.body = body;
    }
    if (headers) {
      config.headers = headers;
    }
    return this.makeRequest<T>(endpoint, config);
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const config: RequestConfig = { method: "PUT" };
    if (body !== undefined) {
      config.body = body;
    }
    if (headers) {
      config.headers = headers;
    }
    return this.makeRequest<T>(endpoint, config);
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const config: RequestConfig = { method: "PATCH" };
    if (body !== undefined) {
      config.body = body;
    }
    if (headers) {
      config.headers = headers;
    }
    return this.makeRequest<T>(endpoint, config);
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const config: RequestConfig = { method: "DELETE" };
    if (headers) {
      config.headers = headers;
    }
    return this.makeRequest<T>(endpoint, config);
  }

  // Method to set authorization token
  setAuthToken(token: string): void {
    // This could be enhanced to store token and automatically add to headers
    localStorage.setItem("auth_token", token);
  }

  // Method to get authorization token
  getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  // Method to clear authorization token
  clearAuthToken(): void {
    localStorage.removeItem("auth_token");
  }

  // Method to make authenticated requests
  async authenticatedRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    if (!token) {
      return {
        status: false,
        code: 401,
        message: "No authentication token found",
        error: "No authentication token found",
      };
    }

    const headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    return this.makeRequest<T>(endpoint, { ...config, headers });
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
export default httpClient;
