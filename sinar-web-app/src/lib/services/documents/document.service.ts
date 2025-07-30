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
  total: number;
  data: Document[];
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
  async getAllDocuments(): Promise<ApiResponse<Document[]>> {
    try {
      const response = await httpClient.authenticatedRequest<DocumentsResponse>(
        this.baseEndpoint
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
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;