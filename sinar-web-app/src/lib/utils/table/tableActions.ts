import type { BaseTableData, TableActions } from './types';

// Common table action handlers
export function createTableActions<TData extends BaseTableData>(
  callbacks: {
    onView?: (data: TData) => void;
    onEdit?: (data: TData) => void;
    onDelete?: (data: TData) => void;
    onBulkDelete?: (data: TData[]) => void;
    onExport?: (data: TData[]) => void;
    customActions?: Array<{
      label: string;
      action: (data: TData) => void;
      variant?: 'primary' | 'secondary' | 'danger';
      icon?: string;
    }>;
  }
): TableActions<TData> {
  return {
    onView: callbacks.onView,
    onEdit: callbacks.onEdit,
    onDelete: callbacks.onDelete,
    customActions: callbacks.customActions,
  };
}

// Export utilities for common patterns
export const tableUtils = {
  // Format data for export
  formatForExport: <TData extends BaseTableData>(
    data: TData[],
    columns: string[]
  ): Record<string, any>[] => {
    return data.map(item => {
      const formatted: Record<string, any> = {};
      columns.forEach(col => {
        formatted[col] = item[col];
      });
      return formatted;
    });
  },

  // Generate CSV from data
  generateCSV: <TData extends BaseTableData>(
    data: TData[],
    columns: { key: keyof TData; label: string }[]
  ): string => {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : String(value || '');
      }).join(',')
    );
    
    return [headers, ...rows].join('\n');
  },

  // Download CSV file
  downloadCSV: (csvContent: string, filename: string = 'export.csv') => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  // Filter data by search term
  filterData: <TData extends BaseTableData>(
    data: TData[],
    searchTerm: string,
    searchFields: (keyof TData)[]
  ): TData[] => {
    if (!searchTerm.trim()) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return String(value || '').toLowerCase().includes(term);
      })
    );
  },

  // Sort data by field
  sortData: <TData extends BaseTableData>(
    data: TData[],
    field: keyof TData,
    direction: 'asc' | 'desc' = 'asc'
  ): TData[] => {
    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal === bVal) return 0;
      
      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;
      
      return direction === 'desc' ? comparison * -1 : comparison;
    });
  },

  // Paginate data
  paginateData: <TData extends BaseTableData>(
    data: TData[],
    page: number,
    pageSize: number
  ): { data: TData[]; totalPages: number; hasNext: boolean; hasPrev: boolean } => {
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / pageSize);
    
    return {
      data: paginatedData,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrev: page > 0,
    };
  },

  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },
};

// Predefined action sets for common use cases
export const commonActions = {
  // Standard CRUD actions
  crud: <TData extends BaseTableData>(callbacks: {
    onView?: (data: TData) => void;
    onEdit?: (data: TData) => void;
    onDelete?: (data: TData) => void;
  }): TableActions<TData> => createTableActions(callbacks),

  // Document management actions
  documents: <TData extends BaseTableData>(callbacks: {
    onView?: (data: TData) => void;
    onEdit?: (data: TData) => void;
    onDelete?: (data: TData) => void;
    onDownload?: (data: TData) => void;
    onShare?: (data: TData) => void;
  }): TableActions<TData> => createTableActions({
    ...callbacks,
    customActions: [
      ...(callbacks.onDownload ? [{
        label: 'Download',
        action: callbacks.onDownload,
        variant: 'secondary' as const,
        icon: 'download',
      }] : []),
      ...(callbacks.onShare ? [{
        label: 'Share',
        action: callbacks.onShare,
        variant: 'secondary' as const,
        icon: 'share',
      }] : []),
    ],
  }),

  // User management actions
  users: <TData extends BaseTableData>(callbacks: {
    onView?: (data: TData) => void;
    onEdit?: (data: TData) => void;
    onDelete?: (data: TData) => void;
    onActivate?: (data: TData) => void;
    onDeactivate?: (data: TData) => void;
  }): TableActions<TData> => createTableActions({
    ...callbacks,
    customActions: [
      ...(callbacks.onActivate ? [{
        label: 'Activate',
        action: callbacks.onActivate,
        variant: 'primary' as const,
      }] : []),
      ...(callbacks.onDeactivate ? [{
        label: 'Deactivate',
        action: callbacks.onDeactivate,
        variant: 'danger' as const,
      }] : []),
    ],
  }),
};

export default { createTableActions, tableUtils, commonActions };