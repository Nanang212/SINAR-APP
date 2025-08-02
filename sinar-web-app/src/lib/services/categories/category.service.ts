import { httpClient, type ApiResponse } from '../api/http-client';

// Category interfaces based on API response
export interface Category {
  id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number | null;
}

export interface CategoriesResponse {
  status: boolean;
  code: number;
  message: string;
  total?: number;
  data: Category[];
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface GetCategoriesParams {
  limit?: number;
  page?: number;
}

class CategoryService {
  private readonly baseEndpoint = '/api/v1/categories';
  private readonly adminBaseEndpoint = '/api/v1/admin/categories';

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

  /**
   * Get all categories with pagination
   */
  async getAllCategoriesWithPagination(params?: GetCategoriesParams): Promise<ApiResponse<CategoriesResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }

      const url = `${this.baseEndpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await httpClient.authenticatedRequest<CategoriesResponse>(url);

      console.log('Category service - getAllCategoriesWithPagination response:', response);
      
      if (response.status && response.data) {
        return {
          status: true,
          code: response.code,
          message: response.message,
          data: response.data,
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
   * Create new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    try {
      const response = await httpClient.authenticatedRequest<CategoriesResponse>(
        `${this.adminBaseEndpoint}`,
        {
          method: 'POST',
          body: data,
        }
      );

      console.log('Category service - create response:', response);
      
      if (response.status && response.data) {
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
        message: response.message || 'Failed to create category',
        error: response.error || 'Failed to create category',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to create category',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing category
   */
  async updateCategory(id: string | number, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    try {
      const response = await httpClient.authenticatedRequest<CategoriesResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: data,
        }
      );

      console.log('Category service - update response:', response);
      
      if (response.status && response.data) {
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
        message: response.message || 'Failed to update category',
        error: response.error || 'Failed to update category',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to update category',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string | number): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.authenticatedRequest<CategoriesResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'DELETE',
        }
      );

      console.log('Category service - delete response:', response);
      
      if (response.status) {
        return {
          status: true,
          code: response.code,
          message: response.message,
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to delete category',
        error: response.error || 'Failed to delete category',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to delete category',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;