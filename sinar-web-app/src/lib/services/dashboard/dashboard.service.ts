import type { ApiResponse } from '../api/http-client';
import { httpClient } from '../api/http-client';

export interface MonthlyDocumentStat {
  month: number;
  month_name: string;
  total_documents: number;
}

export interface DocumentStatistics {
  year: number;
  monthly_stats: MonthlyDocumentStat[];
  total_documents_year: number;
}

export interface ReportTypeBreakdown {
  TEXT: number;
  LINK: number;
  AUDIO: number;
  VIDEO: number;
}

export interface MonthlyReportStat {
  month: number;
  month_name: string;
  total_items: number;
  by_type: ReportTypeBreakdown;
}

export interface ReportStatistics {
  year: number;
  monthly_stats: MonthlyReportStat[];
  types: string[];
  total_items_year: number;
}

export interface UserRole {
  role_id: number;
  role_name: string;
  total_users: number;
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  by_role: UserRole[];
}

class DashboardService {
  private readonly baseEndpoint = '/api/v1/admin/dashboard/stats';

  /**
   * Get document statistics by month for current year
   */
  async getDocumentStatistics(): Promise<ApiResponse<DocumentStatistics>> {
    try {
      const response = await httpClient.authenticatedRequest<DocumentStatistics>(
        `${this.baseEndpoint}/documents`,
        {
          method: 'GET'
        }
      );

      console.log('Dashboard service - document stats response:', response);
      return response;
    } catch (error) {
      console.error('Dashboard service - error fetching document statistics:', error);
      throw error;
    }
  }

  /**
   * Get report statistics by month for current year
   */
  async getReportStatistics(): Promise<ApiResponse<ReportStatistics>> {
    try {
      const response = await httpClient.authenticatedRequest<ReportStatistics>(
        `${this.baseEndpoint}/reports`,
        {
          method: 'GET'
        }
      );

      console.log('Dashboard service - report stats response:', response);
      return response;
    } catch (error) {
      console.error('Dashboard service - error fetching report statistics:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<ApiResponse<UserStatistics>> {
    try {
      const response = await httpClient.authenticatedRequest<UserStatistics>(
        `${this.baseEndpoint}/users`,
        {
          method: 'GET'
        }
      );

      console.log('Dashboard service - user stats response:', response);
      return response;
    } catch (error) {
      console.error('Dashboard service - error fetching user statistics:', error);
      throw error;
    }
  }

  /**
   * Get all dashboard statistics at once
   */
  async getAllStatistics(): Promise<{
    documents: ApiResponse<DocumentStatistics>;
    reports: ApiResponse<ReportStatistics>;
    users: ApiResponse<UserStatistics>;
  }> {
    try {
      const [documents, reports, users] = await Promise.all([
        this.getDocumentStatistics(),
        this.getReportStatistics(),
        this.getUserStatistics()
      ]);

      return { documents, reports, users };
    } catch (error) {
      console.error('Dashboard service - error fetching all statistics:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();