import { httpClient, type ApiResponse } from '../api/http-client';

// Document interfaces based on API response
export interface Document {
  id: number;
  title: string;
  remark: string | null;
  filename: string;
  original_name: string;
  url: string;
  is_downloaded: boolean;
  uploaded_at: string;
  createdBy: string;
  updatedBy: string;
  username_upload: string;
  categories: any[];
}

export interface DocumentsResponse {
  status: boolean;
  code: number;
  message: string;
  total?: number;
  page?: number;
  data: Document[];
}

export interface PaginatedDocumentsResponse {
  status: boolean;
  code: number;
  message: string;
  total: number;
  totalPages: number;
  currentPage: number;
  data: Document[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  order?: 'asc' | 'desc';
}

export interface UploadDocumentRequest {
  file: File;
  title: string;
  remark: string;
  category_ids: string[];
}

export interface UpdateDocumentRequest {
  file?: File; // Optional for update
  title: string;
  remark: string;
  category_ids: string[];
}

class DocumentService {
  private readonly baseEndpoint = '/api/v1/documents';
  private readonly adminBaseEndpoint = '/api/v1/admin/documents';

  /**
   * Get all documents
   */
  async getAllDocuments(params?: { search?: string; order?: 'asc' | 'desc' }): Promise<ApiResponse<Document[]>> {
    try {
      const queryParams = new URLSearchParams();

      // Add search parameter if provided
      if (params?.search && params.search.trim() !== '') {
        queryParams.append('search', params.search.trim());
      }

      // Add order parameter if provided
      if (params?.order && (params.order === 'asc' || params.order === 'desc')) {
        queryParams.append('order', params.order);
      }

      const fullUrl = queryParams.toString() 
        ? `${this.baseEndpoint}?${queryParams.toString()}`
        : this.baseEndpoint;

      console.log('🚀 Document Service - Making request to:', fullUrl);
      console.log('📋 Request parameters:', params);

      const response = await httpClient.authenticatedRequest<DocumentsResponse>(
        fullUrl
      );

      console.log('Document service - raw response:', response);
      
      if (response.status && response.data) {
        // Handle both nested and direct data structure
        const documents = response.data.data || response.data;
        
        return {
          status: true,
          code: response.code,
          message: response.message,
          data: Array.isArray(documents) ? documents : [],
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch documents',
        error: response.error || 'Failed to fetch documents',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get paginated documents
   */
  async getPaginatedDocuments(params: PaginationParams = {}): Promise<ApiResponse<PaginatedDocumentsResponse>> {
    try {
      const { page = 1, limit = 10, search, order } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add search parameter if provided
      if (search && search.trim() !== '') {
        queryParams.append('search', search.trim());
      }

      // Add order parameter if provided
      if (order && (order === 'asc' || order === 'desc')) {
        queryParams.append('order', order);
      }

      const fullUrl = `${this.baseEndpoint}?${queryParams.toString()}`;
      console.log('🚀 Document Service - Making request to:', fullUrl);
      console.log('📋 Request parameters:', { page, limit, search, order });
      
      const response = await httpClient.authenticatedRequest<any>(fullUrl);

      console.log('✅ Document service - paginated response:', response);
      console.log('Document service - response.data:', response.data);
      console.log('Document service - response.data type:', typeof response.data);
      
      if (response.status && response.data) {
        // HTTP client now preserves total and page at response level
        const documents = Array.isArray(response.data) ? response.data : [];
        const total = response.total || 0;
        const currentPage = response.page || page;
        
        // Calculate pagination info from total and limit
        const totalPages = Math.ceil(total / limit);
        
        console.log('Service Debug:');
        console.log('- Raw response:', response);
        console.log('- Response.total:', response.total);
        console.log('- Response.page:', response.page);
        console.log('- Total from API:', total);
        console.log('- Current page from API:', currentPage);
        console.log('- Limit:', limit);
        console.log('- Calculated totalPages:', totalPages);
        console.log('- Documents array:', documents);
        console.log('- Documents length:', documents.length);
        
        const paginatedResponse: PaginatedDocumentsResponse = {
          status: response.status,
          code: response.code,
          message: response.message,
          total: total,
          totalPages: totalPages,
          currentPage: currentPage,
          data: documents,
        };

        console.log('Service returning paginatedResponse:', paginatedResponse);

        return {
          status: true,
          code: response.code,
          message: response.message,
          data: paginatedResponse,
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch documents',
        error: response.error || 'Failed to fetch documents',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string | number): Promise<ApiResponse<Document>> {
    try {
      const response = await httpClient.authenticatedRequest<DocumentsResponse>(
        `${this.baseEndpoint}/${id}`
      );

      console.log('Document service - getById raw response:', response);
      
      if (response.status && response.data) {
        // Handle both nested and direct data structure
        const document = response.data.data || response.data;
        const singleDocument = Array.isArray(document) ? document[0] : document;
        
        if (singleDocument) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleDocument,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch document',
        error: response.error || 'Failed to fetch document',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload new document
   */
  async uploadDocument(data: UploadDocumentRequest): Promise<ApiResponse<Document>> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      formData.append('remark', data.remark);
      
      // Handle multiple category_ids
      data.category_ids.forEach(categoryId => {
        formData.append('category_ids', categoryId);
      });

      const response = await httpClient.authenticatedRequest<DocumentsResponse>(
        `${this.adminBaseEndpoint}/upload`,
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header, let browser set it with boundary for FormData
        }
      );

      console.log('Document service - upload response:', response);
      
      if (response.status && response.data) {
        const document = response.data.data || response.data;
        const singleDocument = Array.isArray(document) ? document[0] : document;
        
        if (singleDocument) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleDocument,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to upload document',
        error: response.error || 'Failed to upload document',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing document
   */
  async updateDocument(id: string | number, data: UpdateDocumentRequest): Promise<ApiResponse<Document>> {
    try {
      const formData = new FormData();
      
      // Add file only if provided
      if (data.file) {
        formData.append('file', data.file);
      }
      
      formData.append('title', data.title);
      formData.append('remark', data.remark);
      
      // Handle multiple category_ids
      data.category_ids.forEach(categoryId => {
        formData.append('category_ids', categoryId);
      });

      const response = await httpClient.authenticatedRequest<DocumentsResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: formData,
          // Don't set Content-Type header, let browser set it with boundary for FormData
        }
      );

      console.log('Document service - update response:', response);
      
      if (response.status && response.data) {
        const document = response.data.data || response.data;
        const singleDocument = Array.isArray(document) ? document[0] : document;
        
        if (singleDocument) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleDocument,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to update document',
        error: response.error || 'Failed to update document',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to update document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload new document using FormData directly
   */
  async uploadDocumentWithFormData(formData: FormData): Promise<ApiResponse<Document>> {
    try {
      const response = await httpClient.authenticatedRequest<DocumentsResponse>(
        `${this.adminBaseEndpoint}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Document service - upload response:', response);
      
      if (response.status && response.data) {
        const document = response.data.data || response.data;
        const singleDocument = Array.isArray(document) ? document[0] : document;
        
        if (singleDocument) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleDocument,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to upload document',
        error: response.error || 'Failed to upload document',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing document using FormData directly
   */
  async updateDocumentWithFormData(id: string | number, formData: FormData): Promise<ApiResponse<Document>> {
    try {
      const response = await httpClient.authenticatedRequest<DocumentsResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: formData,
        }
      );

      console.log('Document service - update response:', response);
      
      if (response.status && response.data) {
        const document = response.data.data || response.data;
        const singleDocument = Array.isArray(document) ? document[0] : document;
        
        if (singleDocument) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleDocument,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to update document',
        error: response.error || 'Failed to update document',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to update document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download document by ID
   */
  async downloadDocument(id: string | number, originalName?: string): Promise<void> {
    try {
      const response = await httpClient.authenticatedRequest<Blob>(
        `${this.baseEndpoint}/download/${id}`,
        {
          method: 'GET',
          responseType: 'blob'
        }
      );

      if (response.status && response.data instanceof Blob) {
        // Create blob URL and trigger download
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        
        // Use original name if provided, otherwise try from Content-Disposition header
        let filename = originalName || `document_${id}`;
        
        if (!originalName) {
          const contentDisposition = (response as any).headers?.get('Content-Disposition');
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) {
              filename = match[1];
            }
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.message || 'Download failed');
      }
    } catch (error) {
      console.error('Failed to download document:', error);
      throw new Error(error instanceof Error ? error.message : 'Download failed');
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(id: string | number): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.authenticatedRequest<DocumentsResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'DELETE'
        }
      );

      console.log('Document service - delete response:', response);
      
      if (response.status) {
        return {
          status: true,
          code: response.code,
          message: response.message || 'Document deleted successfully',
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to delete document',
        error: response.error || 'Failed to delete document',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Preview document content as HTML (for .doc/.docx files)
   */
  async previewDocument(id: string | number): Promise<ApiResponse<string>> {
    try {
      const response = await httpClient.authenticatedRequest<any>(
        `${this.baseEndpoint}/preview/${id}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/html, application/json'
          }
        }
      );

      console.log('Document service - preview response:', response);
      
      if (response.status) {
        // If response is HTML string directly
        if (typeof response.data === 'string') {
          return {
            status: true,
            code: response.code || 200,
            message: response.message || 'Document preview loaded successfully',
            data: response.data,
          };
        }
        
        // If response has nested data structure
        if (response.data && typeof response.data === 'object') {
          const htmlContent = response.data.html || response.data.content || response.data;
          if (typeof htmlContent === 'string') {
            return {
              status: true,
              code: response.code || 200,
              message: response.message || 'Document preview loaded successfully',
              data: htmlContent,
            };
          }
        }
      }

      return {
        status: false,
        code: response.code || 500,
        message: response.message || 'Failed to preview document',
        error: response.error || 'Failed to preview document',
      };
    } catch (error) {
      console.error('Failed to preview document:', error);
      return {
        status: false,
        code: 0,
        message: 'Failed to preview document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;