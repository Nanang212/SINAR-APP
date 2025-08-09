import { httpClient, type ApiResponse } from '../api/http-client';

// Report interfaces based on API response
export interface ReportItem {
  id: number;
  type: 'TEXT' | 'LINK' | 'AUDIO' | 'VIDEO';
  content: string;
  original_name: string | null;
  description: string | null;
  is_downloaded: boolean;
  downloaded_at: string | null;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number;
  user: {
    id: number;
    username: string;
  };
  download_url: string | null;
  preview_url: string | null;
}

export interface ReportDocument {
  document: {
    id: number;
    original_name: string;
    url: string;
  };
  reports: {
    TEXT?: ReportItem[];
    LINK?: ReportItem[];
    AUDIO?: ReportItem[];
    VIDEO?: ReportItem[];
  };
}

export interface ReportsGroupedResponse {
  status: boolean;
  code: number;
  message: string;
  total: number;
  page: number;
  data: ReportDocument[];
}

// Legacy interface for backward compatibility
export interface Report {
  id: number;
  document_id: number;
  description: string | null;
  video_url: string | null;
  audio_url: string | null;
  video_filename: string | null;
  audio_filename: string | null;
  video_original_name: string | null;
  audio_original_name: string | null;
  link: string | null;
  text: string | null;
  created_at: string;
  updated_at: string;
  document?: {
    id: number;
    title: string;
    filename: string;
    original_name: string;
    url: string;
    remark: string | null;
    uploaded_at: string;
    username_upload: string;
    categories?: Array<{
      id: number;
      name: string;
      description: string | null;
    }>;
  };
}

export interface ReportsResponse {
  status: boolean;
  code: number;
  message: string;
  total?: number;
  page?: number;
  data: Report[];
}

export interface PaginatedReportsResponse {
  status: boolean;
  code: number;
  message: string;
  total: number;
  totalPages: number;
  currentPage: number;
  data: Report[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  order?: 'asc' | 'desc';
  document_id?: number;
}

export interface CreateReportRequest {
  document_id: string;
  description?: string;
  video?: File[];
  audio?: File[];
  link?: string[];
  text?: string[];
}

export interface CreateReportWithTypeRequest {
  document_id: string;
  description?: string;
  file: File;
  type: 'VIDEO' | 'AUDIO';
}

export interface UpdateReportRequest {
  description?: string;
  video?: File[];
  audio?: File[];
  link?: string[];
  text?: string[];
}

class ReportService {
  private readonly baseEndpoint = '/api/v1/reports';
  private readonly adminBaseEndpoint = '/api/v1/admin/reports';

  /**
   * Get all reports (user endpoint)
   */
  async getAllReports(): Promise<ApiResponse<Report[]>> {
    try {
      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        this.baseEndpoint
      );

      console.log('Report service - raw response:', response);
      
      if (response.status && response.data) {
        // Handle both nested and direct data structure
        const reports = response.data.data || response.data;
        
        return {
          status: true,
          code: response.code,
          message: response.message,
          data: Array.isArray(reports) ? reports : [],
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch reports',
        error: response.error || 'Failed to fetch reports',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch reports',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all reports (admin endpoint) - new grouped format
   */
  async getAllReportsAdmin(): Promise<ApiResponse<ReportDocument[]>> {
    try {
      const response = await httpClient.authenticatedRequest<ReportsGroupedResponse>(
        this.adminBaseEndpoint
      );

      console.log('Report service admin - raw response:', response);
      
      if (response.status && response.data) {
        return {
          status: true,
          code: response.code,
          message: response.message,
          data: response.data || [],
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch reports',
        error: response.error || 'Failed to fetch reports',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch reports',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get paginated reports
   */
  async getPaginatedReports(params: PaginationParams = {}): Promise<ApiResponse<PaginatedReportsResponse>> {
    try {
      const { page = 1, limit = 10, search, order, document_id } = params;
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

      if (document_id) {
        queryParams.append('document_id', document_id.toString());
      }

      const fullUrl = `${this.adminBaseEndpoint}?${queryParams.toString()}`;
      console.log('🚀 Report Service - Making request to:', fullUrl);
      console.log('📋 Request parameters:', { page, limit, search, order, document_id });
      
      const response = await httpClient.authenticatedRequest<any>(fullUrl);

      console.log('Report service - paginated response:', response);
      
      if (response.status && response.data) {
        // Response sudah dalam format yang benar dengan total, totalPages, dll
        const paginatedResponse: PaginatedReportsResponse = {
          status: response.status,
          code: response.code,
          message: response.message,
          total: response.total || 0,
          totalPages: response.totalPages || Math.ceil((response.total || 0) / limit),
          currentPage: response.page || page,
          data: Array.isArray(response.data) ? response.data : [],
        };

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
        message: response.message || 'Failed to fetch reports',
        error: response.error || 'Failed to fetch reports',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch reports',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(id: string | number): Promise<ApiResponse<Report>> {
    try {
      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        `${this.baseEndpoint}/${id}`
      );

      console.log('Report service - getById raw response:', response);
      
      if (response.status && response.data) {
        const report = response.data.data || response.data;
        const singleReport = Array.isArray(report) ? report[0] : report;
        
        if (singleReport) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleReport,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to fetch report',
        error: response.error || 'Failed to fetch report',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to fetch report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create new report with form data (supports multiple files and links/texts)
   */
  async createReport(data: CreateReportRequest): Promise<ApiResponse<Report>> {
    try {
      const formData = new FormData();
      formData.append('document_id', data.document_id);
      
      if (data.description) {
        formData.append('description', data.description);
      }
      
      // Handle multiple video files
      if (data.video && data.video.length > 0) {
        data.video.forEach((videoFile) => {
          formData.append('video', videoFile);
        });
      }
      
      // Handle multiple audio files
      if (data.audio && data.audio.length > 0) {
        data.audio.forEach((audioFile) => {
          formData.append('audio', audioFile);
        });
      }
      
      // Handle multiple links
      if (data.link && data.link.length > 0) {
        data.link.forEach((linkText) => {
          formData.append('link', linkText);
        });
      }
      
      // Handle multiple texts
      if (data.text && data.text.length > 0) {
        data.text.forEach((textContent) => {
          formData.append('text', textContent);
        });
      }

      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        this.adminBaseEndpoint,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Report service - create response:', response);
      
      if (response.status && response.data) {
        const report = response.data.data || response.data;
        const singleReport = Array.isArray(report) ? report[0] : report;
        
        if (singleReport) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleReport,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to create report',
        error: response.error || 'Failed to create report',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to create report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create new report using FormData directly
   */
  async createReportWithFormData(formData: FormData): Promise<ApiResponse<Report>> {
    try {
      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        this.adminBaseEndpoint,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Report service - create response:', response);
      
      if (response.status && response.data) {
        const report = response.data.data || response.data;
        const singleReport = Array.isArray(report) ? report[0] : report;
        
        if (singleReport) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleReport,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to create report',
        error: response.error || 'Failed to create report',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to create report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create new report with type field (alternative API format)
   */
  async createReportWithType(data: CreateReportWithTypeRequest): Promise<ApiResponse<Report>> {
    try {
      const formData = new FormData();
      formData.append('document_id', data.document_id);
      formData.append('type', data.type);
      formData.append('file', data.file);
      
      if (data.description) {
        formData.append('description', data.description);
      }

      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        this.adminBaseEndpoint,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Report service - create with type response:', response);
      
      if (response.status && response.data) {
        const report = response.data.data || response.data;
        const singleReport = Array.isArray(report) ? report[0] : report;
        
        if (singleReport) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleReport,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to create report',
        error: response.error || 'Failed to create report',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to create report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing report (supports multiple files and links/texts)
   */
  async updateReport(id: string | number, data: UpdateReportRequest): Promise<ApiResponse<Report>> {
    try {
      const formData = new FormData();
      
      if (data.description !== undefined) {
        formData.append('description', data.description);
      }
      
      // Handle multiple video files
      if (data.video && data.video.length > 0) {
        data.video.forEach((videoFile) => {
          formData.append('video', videoFile);
        });
      }
      
      // Handle multiple audio files
      if (data.audio && data.audio.length > 0) {
        data.audio.forEach((audioFile) => {
          formData.append('audio', audioFile);
        });
      }
      
      // Handle multiple links
      if (data.link && data.link.length > 0) {
        data.link.forEach((linkText) => {
          formData.append('link', linkText);
        });
      }
      
      // Handle multiple texts
      if (data.text && data.text.length > 0) {
        data.text.forEach((textContent) => {
          formData.append('text', textContent);
        });
      }

      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: formData,
        }
      );

      console.log('Report service - update response:', response);
      
      if (response.status && response.data) {
        const report = response.data.data || response.data;
        const singleReport = Array.isArray(report) ? report[0] : report;
        
        if (singleReport) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleReport,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to update report',
        error: response.error || 'Failed to update report',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to update report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing report using FormData directly
   */
  async updateReportWithFormData(id: string | number, formData: FormData): Promise<ApiResponse<Report>> {
    try {
      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: formData,
        }
      );

      console.log('Report service - update response:', response);
      
      if (response.status && response.data) {
        const report = response.data.data || response.data;
        const singleReport = Array.isArray(report) ? report[0] : report;
        
        if (singleReport) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleReport,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to update report',
        error: response.error || 'Failed to update report',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to update report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing report with specific type and content
   */
  async updateReportWithTypeAndContent(
    id: string | number, 
    type: 'audio' | 'video' | 'link' | 'text',
    content: string | File,
    description?: string
  ): Promise<ApiResponse<Report>> {
    try {
      const formData = new FormData();
      
      // Add description if provided
      if (description) {
        formData.append('description', description);
      }
      
      // Handle content based on type - use type as the form key
      if (type === 'audio' || type === 'video') {
        // For audio/video, content should be a File
        if (content instanceof File) {
          formData.append(type, content); // Use 'audio' or 'video' as key
        } else {
          throw new Error(`Content must be a File for ${type} type`);
        }
      } else if (type === 'link' || type === 'text') {
        // For link/text, content should be a string
        if (typeof content === 'string') {
          formData.append(type, content); // Use 'link' or 'text' as key
        } else {
          throw new Error(`Content must be a string for ${type} type`);
        }
      }

      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: formData,
        }
      );

      console.log('Report service - update with type response:', response);
      
      if (response.status && response.data) {
        const report = response.data.data || response.data;
        const singleReport = Array.isArray(report) ? report[0] : report;
        
        if (singleReport) {
          return {
            status: true,
            code: response.code,
            message: response.message,
            data: singleReport,
          };
        }
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to update report',
        error: response.error || 'Failed to update report',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to update report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete report by ID
   */
  async deleteReport(id: string | number): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.authenticatedRequest<ReportsResponse>(
        `${this.adminBaseEndpoint}/${id}`,
        {
          method: 'DELETE'
        }
      );

      console.log('Report service - delete response:', response);
      
      if (response.status) {
        return {
          status: true,
          code: response.code,
          message: response.message || 'Report deleted successfully',
        };
      }

      return {
        status: false,
        code: response.code,
        message: response.message || 'Failed to delete report',
        error: response.error || 'Failed to delete report',
      };
    } catch (error) {
      return {
        status: false,
        code: 0,
        message: 'Failed to delete report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download video file by report ID
   */
  async downloadVideo(id: string | number, originalName?: string): Promise<void> {
    try {
      const response = await httpClient.authenticatedRequest<Blob>(
        `${this.baseEndpoint}/${id}/download/video`,
        {
          method: 'GET',
          responseType: 'blob'
        }
      );

      if (response.status && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        
        let filename = originalName || `report_video_${id}.mp4`;
        
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
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.message || 'Download failed');
      }
    } catch (error) {
      console.error('Failed to download video:', error);
      throw new Error(error instanceof Error ? error.message : 'Download failed');
    }
  }

  /**
   * Download audio file by report ID
   */
  async downloadAudio(id: string | number, originalName?: string): Promise<void> {
    try {
      const response = await httpClient.authenticatedRequest<Blob>(
        `${this.baseEndpoint}/${id}/download/audio`,
        {
          method: 'GET',
          responseType: 'blob'
        }
      );

      if (response.status && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        
        let filename = originalName || `report_audio_${id}.m4a`;
        
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
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.message || 'Download failed');
      }
    } catch (error) {
      console.error('Failed to download audio:', error);
      throw new Error(error instanceof Error ? error.message : 'Download failed');
    }
  }

  /**
   * Download report file by ID (for audio and video) with authentication
   */
  async downloadReportById(id: string | number, originalName?: string): Promise<void> {
    try {
      // Create a temporary form to download with authentication
      const response = await httpClient.authenticatedRequest<Blob>(
        `${this.adminBaseEndpoint}/download/${id}`,
        {
          method: 'GET',
          responseType: 'blob'
        }
      );

      if (response.status && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        
        // Use original name if provided, otherwise try to get filename from Content-Disposition header
        let filename = originalName || `report_${id}`;
        const contentDisposition = (response as any).headers?.get('Content-Disposition') || 
                                   (response as any).headers?.get('content-disposition');
        
        if (contentDisposition) {
          // Try different patterns for filename extraction
          const patterns = [
            /filename[^;=\n]*=\s*"([^"]+)"/i,
            /filename[^;=\n]*=\s*'([^']+)'/i,
            /filename[^;=\n]*=\s*([^;\n]+)/i,
            /filename\*=UTF-8''([^;\n]+)/i
          ];
          
          for (const pattern of patterns) {
            const match = contentDisposition.match(pattern);
            if (match && match[1]) {
              filename = decodeURIComponent(match[1].trim());
              break;
            }
          }
        }
        
        // If no filename from header and no original name, try to detect from blob type
        if (!originalName && filename === `report_${id}`) {
          const blobType = response.data.type;
          console.log('Blob MIME type:', blobType);
          
          if (blobType.includes('audio')) {
            filename = `report_${id}.mp3`; // Default audio extension
            if (blobType.includes('mp3')) filename = `report_${id}.mp3`;
            else if (blobType.includes('m4a')) filename = `report_${id}.m4a`;
            else if (blobType.includes('wav')) filename = `report_${id}.wav`;
            else if (blobType.includes('aac')) filename = `report_${id}.aac`;
          } else if (blobType.includes('video')) {
            filename = `report_${id}.mp4`; // Default video extension
            if (blobType.includes('mp4')) filename = `report_${id}.mp4`;
            else if (blobType.includes('avi')) filename = `report_${id}.avi`;
            else if (blobType.includes('mov')) filename = `report_${id}.mov`;
            else if (blobType.includes('wmv')) filename = `report_${id}.wmv`;
            else if (blobType.includes('mkv')) filename = `report_${id}.mkv`;
          }
        }
        
        console.log('Final filename:', filename);
        console.log('Content-Disposition:', contentDisposition);
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.message || 'Download failed');
      }
    } catch (error) {
      console.error('Failed to download report:', error);
      throw new Error(error instanceof Error ? error.message : 'Download failed');
    }
  }

  /**
   * Get preview URL for report file
   */
  getPreviewUrl(id: string | number): string {
    return `${this.adminBaseEndpoint}/preview/${id}`;
  }

  /**
   * Get audio blob for preview with authentication
   */
  async getAudioBlob(id: string | number): Promise<Blob> {
    try {
      const response = await httpClient.authenticatedRequest<Blob>(
        `${this.adminBaseEndpoint}/preview/${id}`,
        {
          method: 'GET',
          responseType: 'blob'
        }
      );

      if (response.status && response.data instanceof Blob) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get audio blob');
      }
    } catch (error) {
      console.error('Failed to get audio blob:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get audio blob');
    }
  }

  /**
   * Get video blob for preview with authentication
   */
  async getVideoBlob(id: string | number): Promise<Blob> {
    try {
      const response = await httpClient.authenticatedRequest<Blob>(
        `${this.adminBaseEndpoint}/preview/${id}`,
        {
          method: 'GET',
          responseType: 'blob'
        }
      );

      if (response.status && response.data instanceof Blob) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get video blob');
      }
    } catch (error) {
      console.error('Failed to get video blob:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get video blob');
    }
  }

  /**
   * Preview report file by ID (for audio and video) with authentication
   */
  async previewReportById(id: string | number): Promise<void> {
    try {
      // Get the blob data with authentication
      const response = await httpClient.authenticatedRequest<Blob>(
        `${this.adminBaseEndpoint}/preview/${id}`,
        {
          method: 'GET',
          responseType: 'blob'
        }
      );

      if (response.status && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        window.open(url, '_blank');
        
        // Clean up the object URL after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        throw new Error(response.message || 'Preview failed');
      }
    } catch (error) {
      console.error('Failed to preview report:', error);
      throw new Error(error instanceof Error ? error.message : 'Preview failed');
    }
  }
}

// Export singleton instance
export const reportService = new ReportService();
export default reportService;