// Export all services for easy importing
export { httpClient } from './api/http-client';
export { authService } from './auth/auth.service';

// Export types
export type { ApiResponse, RequestConfig } from './api/http-client';
export type { 
  LoginRequest, 
  LoginResponse, 
  UserProfile 
} from './auth/auth.service';