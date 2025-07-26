/**
 * Token helper utilities for JWT token management
 */

export interface JWTPayload {
  id: number;
  role: string;
  category_id?: number | null;
  iat: number; // issued at
  exp: number; // expires at
}

export class TokenHelper {
  /**
   * Decode JWT token payload (client-side only for UX optimization)
   * Note: This is NOT for security validation, only for UX improvements
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      // Only run in browser environment
      if (typeof window === "undefined") {
        return null;
      }

      // JWT structure: header.payload.signature
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      // Decode base64 payload
      const payload = parts[1];
      if (!payload) {
        return null;
      }
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
      console.warn("Failed to decode token:", error);
      return null;
    }
  }

  /**
   * Check if token is expired (client-side check)
   * Note: Backend should always be the final authority
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) {
      return true;
    }

    // Check if current time is past expiration (with 30 second buffer)buk
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 30; // 30 seconds buffer

    return currentTime >= payload.exp - bufferTime;
  }

  /**
   * Get token expiration time as Date object
   */
  static getTokenExpiration(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  }

  /**
   * Get time until token expires (in seconds)
   */
  static getTimeUntilExpiration(token: string): number {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = payload.exp - currentTime;

    return Math.max(0, timeLeft);
  }

  /**
   * Check if token will expire soon (within specified minutes)
   */
  static willExpireSoon(token: string, withinMinutes: number = 5): boolean {
    const timeLeft = this.getTimeUntilExpiration(token);
    const warningTime = withinMinutes * 60; // Convert to seconds

    return timeLeft > 0 && timeLeft <= warningTime;
  }

  /**
   * Get user info from token payload
   */
  static getUserFromToken(
    token: string
  ): { id: number; role: string; category_id?: number | null } | null {
    const payload = this.decodeToken(token);
    if (!payload) {
      return null;
    }

    const result: { id: number; role: string; category_id?: number | null } = {
      id: payload.id,
      role: payload.role,
    };

    // Only add category_id if it's not undefined
    if (payload.category_id !== undefined) {
      result.category_id = payload.category_id;
    }

    return result;
  }

  /**
   * Validate token format (basic structure check)
   */
  static isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== "string") {
      return false;
    }

    // JWT should have 3 parts separated by dots
    const parts = token.split(".");
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }
}

export default TokenHelper;
