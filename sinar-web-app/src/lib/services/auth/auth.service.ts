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

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  id: number;
  username: string;
  password: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number | null;
  role_id: number;
  category_id: number | null;
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

  // Get user by ID from backend
  async getUserById(userId: number): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await httpClient.authenticatedRequest<{
        id: number;
        username: string;
        is_active: boolean;
        created_at: string;
        created_by: number;
        updated_at: string;
        updated_by: number | null;
        role_id: number;
        category_id: number | null;
        role: {
          id: number;
          name: string;
          is_active: boolean;
          created_at: string;
          created_by: number;
          updated_at: string;
          updated_by: number | null;
        };
        category: any;
      }[]>(`/api/v1/users/${userId}`, {
        method: 'GET'
      });

      if (response.status && response.data && response.data.length > 0) {
        const userData = response.data[0];
        if (!userData) {
          return {
            status: false,
            code: 404,
            message: "User not found",
            error: "User not found"
          };
        }

        // Transform to UserProfile format
        const userProfile: UserProfile = {
          id: userData.id,
          username: userData.username,
          role: userData.role.name,
          category: userData.category
        };

        return {
          status: true,
          code: 200,
          message: response.message || "Success getting user by id",
          data: userProfile
        };
      }

      return {
        status: false,
        code: 404,
        message: "User not found",
        error: "User not found"
      };
    } catch (error) {
      return {
        status: false,
        code: 500,
        message: "Failed to get user data",
        error: "Failed to get user data"
      };
    }
  }

  // Change password
  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<ChangePasswordResponse>> {
    try {
      const response = await httpClient.authenticatedRequest<ChangePasswordResponse>(
        "/api/v1/users/change-password",
        {
          method: 'PUT',
          body: request
        }
      );

      return response;
    } catch (error) {
      return {
        status: false,
        code: 500,
        message: "Failed to change password. Please try again.",
        error: "Failed to change password. Please try again."
      };
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
