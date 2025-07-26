import { httpClient, type ApiResponse } from "../api/http-client";
import { TokenHelper } from "$lib/utils/tokenHelper";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
    category: any;
  };
}

export interface UserProfile {
  id: number;
  username: string;
  role: string;
  category: any;
}

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await httpClient.post<LoginResponse>(
        "/api/v1/auth/login",
        credentials
      );

      if (response.status && response.data) {
        // Store token after successful login
        httpClient.setAuthToken(response.data.token);

        // Store user data in localStorage for persistence
        localStorage.setItem("user_data", JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      return {
        status: false,
        code: 500,
        message: "Login failed. Please try again.",
        error: "Login failed. Please try again.",
      };
    }
  }

  // Logout user
  async logout(): Promise<ApiResponse<void>> {
    try {
      // Call backend logout endpoint to invalidate token
      const response = await httpClient.post<void>("/api/v1/auth/logout");
      
      // Clear local storage regardless of backend response
      this.clearUserSession();

      return response;
    } catch (error) {
      // Clear local storage even if backend call fails
      this.clearUserSession();

      return {
        status: true,
        code: 200,
        message: "Logged out successfully",
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = httpClient.getAuthToken();
    const userData = this.getCurrentUser();

    if (!token || !userData) {
      return false;
    }

    // Check if token is expired (client-side optimization)
    if (TokenHelper.isTokenExpired(token)) {
      // Clear expired token
      this.clearUserSession();
      return false;
    }

    return true;
  }

  // Check if token will expire soon
  isTokenExpiringSoon(withinMinutes: number = 5): boolean {
    const token = httpClient.getAuthToken();
    if (!token) {
      return false;
    }

    return TokenHelper.willExpireSoon(token, withinMinutes);
  }

  // Get token expiration info
  getTokenInfo(): { expiresAt: Date | null; timeLeft: number } | null {
    const token = httpClient.getAuthToken();
    if (!token) {
      return null;
    }

    return {
      expiresAt: TokenHelper.getTokenExpiration(token),
      timeLeft: TokenHelper.getTimeUntilExpiration(token)
    };
  }

  // Get current user data from localStorage
  getCurrentUser(): UserProfile | null {
    try {
      const userData = localStorage.getItem("user_data");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  // Clear user session
  private clearUserSession(): void {
    httpClient.clearAuthToken();
    localStorage.removeItem("user_data");
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
