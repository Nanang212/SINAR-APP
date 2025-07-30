// Export all services for easy importing
export { httpClient } from './api/http-client';
export { authService } from './auth/auth.service';
export { documentService } from './documents/document.service';
export { categoryService } from './categories/category.service';

// Export types
export type { ApiResponse, RequestConfig } from './api/http-client';
export type { 
  LoginRequest, 
  LoginResponse, 
  UserProfile 
} from './auth/auth.service';
export type {
  Document,
  DocumentsResponse,
  UploadDocumentRequest,
  UpdateDocumentRequest
} from './documents/document.service';
export type {
  Category,
  CategoriesResponse
} from './categories/category.service';