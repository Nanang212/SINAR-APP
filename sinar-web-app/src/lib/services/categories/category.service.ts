import { httpClient, type ApiResponse } from '../api/http-client';

// Category interfaces based on API response
export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriesResponse {
  status: boolean;
  code: number;
  message: string;
  data: Category[];
}

class CategoryService {
  private readonly baseEndpoint = '/api/v1/categories';

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await httpClient.authenticatedRequest<CategoriesResponse>(
        this.baseEndpoint
      );

      console.log('Category service - raw response:', response);
      
      if (response.status && response.data) {
        // Handle both nested and direct data structure
        const categories = response.data.data || response.data;
        
        return {
          status: true,
          code: response.code,
          message: response.message,
          data: Array.isArray(categories) ? categories : [],
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch categories',
        error: response.error || 'Failed to fetch categories',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string | number): Promise<ApiResponse<Category>> {
    try {
      const response = await httpClient.authenticatedRequest<CategoriesResponse>(
        `${this.baseEndpoint}/${id}`
      );

      console.log('Category service - getById raw response:', response);
      
      if (response.status && response.data) {
        // Handle both nested and direct data structure
        const category = response.data.data || response.data;
        const singleCategory = Array.isArray(category) ? category[0] : category;
        
        if (singleCategory) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleCategory,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch category',
        error: response.error || 'Failed to fetch category',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch category',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;