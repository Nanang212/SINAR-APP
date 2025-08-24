import { httpClient, type ApiResponse } from '../api/http-client';

// User interfaces based on API response
export interface User {
  id: number;
  username: string;
  password?: string;
  category_id: number | null;
  created_at: string;
  created_by: number;
  is_active: boolean;
  role_id: number;
  updated_at: string;
  updated_by: number | null;
  role: {
    id: number;
    name: string;
    is_active: boolean;
    created_at: string;
    created_by: number;
    updated_at: string;
    updated_by: number | null;
  };
  category: {
    id: number;
    name: string;
    is_active: boolean;
    created_at: string;
    created_by: number;
    updated_at: string;
    updated_by: number | null;
  } | null;
  email?: string;
  last_login?: string | null;
  profile_picture?: string | null;
  logo?: string | null;
  contact_person?: string;
  name_mentri?: string;
  // New response fields from updated API
  filepath?: string;
  original_name?: string;
  logo_url?: string;
}

export interface UsersResponse {
  status: boolean;
  code: number;
  message: string;
  total: number;
  page: number;
  limit: number;
  data: User[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role_id: number;
  category_id?: number | null;
  contact_person?: string;
  name_mentri?: string;
  logo?: File | null;
}

export interface UpdateUserRequest {
  username?: string;
  role_id?: number;
  category_id?: number | null;
  is_active?: boolean;
  contact_person?: string;
  name_mentri?: string;
  logo?: File | null;
}

export interface ResetPasswordRequest {
  new_password: string;
}

export interface GetUsersParams {
  limit?: number;
  page?: number;
  search?: string;
  order?: 'asc' | 'desc';
}

class UserService {
  private readonly baseEndpoint = '/api/v1/users';
  private readonly adminBaseEndpoint = '/api/v1/admin/users';

  /**
   * Get all users with pagination
   */
  async getAllUsersWithPagination(params?: GetUsersParams): Promise<ApiResponse<UsersResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.search && params.search.trim()) {
        queryParams.append('search', params.search.trim());
      }
      if (params?.order) {
        queryParams.append('order', params.order);
      }

      const url = `${this.baseEndpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await httpClient.authenticatedRequest<UsersResponse>(url);

      console.log('User service - getAllUsersWithPagination response:', response);
      
      if (response.status && response.data) {
        return {
          status: true,
          code: response.code,
          message: response.message,
          data: response.data,
          total: response.total,
          page: response.page,
          limit: response.limit,
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch users',
        error: response.error || 'Failed to fetch users',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await httpClient.authenticatedRequest<UsersResponse>(
        this.adminBaseEndpoint
      );

      console.log('User service - raw response:', response);
      
      if (response.status && response.data) {
        // Handle both nested and direct data structure
        const users = response.data.data || response.data;
        
        return {
          status: true,
          code: response.code,
          message: response.message,
          data: Array.isArray(users) ? users : [],
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch users',
        error: response.error || 'Failed to fetch users',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string | number): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.authenticatedRequest<UsersResponse>(
        `${this.baseEndpoint}/${id}`
      );

      console.log('User service - getById raw response:', response);
      
      if (response.status && response.data) {
        // Handle both nested and direct data structure
        const user = response.data.data || response.data;
        const singleUser = Array.isArray(user) ? user[0] : user;
        
        if (singleUser) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleUser,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch user',
        error: response.error || 'Failed to fetch user',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch user',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create new user with form data (including file upload)
   */
  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Create FormData for file upload support
      const formData = new FormData();
      
      // Add required fields
      formData.append('username', data.username);
      formData.append('password', data.password);
      formData.append('role_id', data.role_id.toString());
      
      // Add optional fields
      if (data.category_id !== undefined && data.category_id !== null) {
        formData.append('category_id', data.category_id.toString());
      }
      if (data.contact_person) {
        formData.append('contact_person', data.contact_person);
      }
      if (data.name_mentri) {
        formData.append('name_mentri', data.name_mentri);
      }
      if (data.logo) {
        formData.append('logo', data.logo);
      }

      const response = await httpClient.authenticatedRequest<UsersResponse>(
        `${this.adminBaseEndpoint}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('User service - create response:', response);
      
      if (response.status && response.data) {
        const user = response.data.data || response.data;
        const singleUser = Array.isArray(user) ? user[0] : user;
        
        if (singleUser) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleUser,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to create user',
        error: response.error || 'Failed to create user',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing user with form data (including file upload)
   */
  async updateUser(id: string | number, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Create FormData for file upload support
      const formData = new FormData();
      
      // Add optional fields only if they exist
      if (data.username) {
        formData.append('username', data.username);
      }
      if (data.role_id !== undefined) {
        formData.append('role_id', data.role_id.toString());
      }
      if (data.category_id !== undefined && data.category_id !== null) {
        formData.append('category_id', data.category_id.toString());
      }
      if (data.is_active !== undefined) {
        formData.append('is_active', data.is_active.toString());
      }
      if (data.contact_person) {
        formData.append('contact_person', data.contact_person);
      }
      if (data.name_mentri) {
        formData.append('name_mentri', data.name_mentri);
      }
      if (data.logo) {
        formData.append('logo', data.logo);
      }

      const response = await httpClient.authenticatedRequest<UsersResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: formData,
        }
      );

      console.log('User service - update response:', response);
      
      if (response.status && response.data) {
        const user = response.data.data || response.data;
        const singleUser = Array.isArray(user) ? user[0] : user;
        
        if (singleUser) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleUser,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to update user',
        error: response.error || 'Failed to update user',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(id: string | number, data: ResetPasswordRequest): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.authenticatedRequest<any>(
        `${this.adminBaseEndpoint}/${id}/reset-password`,
        {
          method: 'PUT',
          body: data,
        }
      );

      console.log('User service - reset password response:', response);
      
      if (response.status) {
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
        message: response.message || 'Failed to reset password',
        error: response.error || 'Failed to reset password',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to reset password',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string | number): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.authenticatedRequest<UsersResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'DELETE',
        }
      );

      console.log('User service - delete response:', response);
      
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
        message: response.message || 'Failed to delete user',
        error: response.error || 'Failed to delete user',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user profile photo preview with authorization
   * Creates a blob URL that can be used as img src
   */
  async getUserProfilePhotoUrl(userId: string | number): Promise<string | null> {
    try {
      const response = await httpClient.authenticatedRequest<Blob>(
        `${this.adminBaseEndpoint}/preview/${userId}`,
        {
          method: 'GET',
          responseType: 'blob'
        }
      );

      if (response.data instanceof Blob) {
        // Create blob URL for the image
        return URL.createObjectURL(response.data);
      }

      console.warn('Profile photo response is not a blob');
      return null;
    } catch (error) {
      console.error('Failed to fetch profile photo:', error);
      return null;
    }
  }

  /**
   * Revoke blob URL to free memory
   */
  revokeProfilePhotoUrl(url: string) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to revoke blob URL:', error);
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;