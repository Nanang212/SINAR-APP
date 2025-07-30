import type { ColumnDef } from '@tanstack/svelte-table';
import type { BaseTableData, TableActions } from './types';

// Badge variant styles
const badgeStyles = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800', 
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
};

// Status to badge variant mapping
const statusBadgeMap: Record<string, keyof typeof badgeStyles> = {
  active: 'success',
  draft: 'warning', 
  archived: 'default',
  inactive: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  published: 'success',
  unpublished: 'default',
};

// Category to badge variant mapping  
const categoryBadgeMap: Record<string, keyof typeof badgeStyles> = {
  policy: 'info',
  manual: 'purple',
  procedure: 'orange',
  form: 'success',
  document: 'default',
};

export const columnHelpers = {
  // Text column
  text: <TData extends BaseTableData>(
    accessor: keyof TData,
    header: string,
    options: {
      className?: string;
      sortable?: boolean;
      width?: number;
      cell?: (value: any) => string;
    } = {}
  ): ColumnDef<TData> => ({
    id: String(accessor),
    accessorKey: accessor,
    header,
    enableSorting: options.sortable !== false,
    size: options.width,
    cell: (info) => {
      const value = info.getValue();
      return options.cell ? options.cell(value) : String(value || '');
    },
    meta: {
      className: options.className,
    },
  }),

  // Badge column (for status, category, etc.)
  badge: <TData extends BaseTableData>(
    accessor: keyof TData,
    header: string,
    options: {
      variant?: keyof typeof badgeStyles;
      variantMap?: Record<string, keyof typeof badgeStyles>;
      className?: string;
      sortable?: boolean;
    } = {}
  ): ColumnDef<TData> => ({
    id: String(accessor),
    accessorKey: accessor,
    header,
    enableSorting: options.sortable !== false,
    cell: (info) => {
      const value = String(info.getValue() || '').toLowerCase();
      const variantMap = options.variantMap || statusBadgeMap;
      const variant = options.variant || variantMap[value] || 'default';
      const badgeClass = badgeStyles[variant];
      
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">
        ${String(info.getValue() || '')}
      </span>`;
    },
    meta: {
      className: options.className,
    },
  }),

  // Date column
  date: <TData extends BaseTableData>(
    accessor: keyof TData,
    header: string,
    options: {
      format?: 'short' | 'long' | 'iso';
      className?: string;
      sortable?: boolean;
    } = {}
  ): ColumnDef<TData> => ({
    id: String(accessor),
    accessorKey: accessor,
    header,
    enableSorting: options.sortable !== false,
    cell: (info) => {
      const value = info.getValue();
      if (!value) return '';
      
      const date = new Date(value as string);
      if (isNaN(date.getTime())) return String(value);
      
      switch (options.format) {
        case 'long':
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'iso':
          return date.toISOString().split('T')[0];
        case 'short':
        default:
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
      }
    },
    meta: {
      className: options.className,
    },
  }),

  // File/Document column with icon
  document: <TData extends BaseTableData>(
    titleAccessor: keyof TData,
    filenameAccessor: keyof TData,
    header: string,
    options: {
      iconAccessor?: keyof TData;
      iconColorAccessor?: keyof TData;
      className?: string;
      sortable?: boolean;
    } = {}
  ): ColumnDef<TData> => ({
    id: 'document',
    accessorKey: titleAccessor,
    header,
    enableSorting: options.sortable !== false,
    cell: (info) => {
      const title = info.getValue();
      const filename = info.row.original[filenameAccessor];
      const iconColor = info.row.original[options.iconColorAccessor || 'iconColor'] || 'text-gray-500';
      
      return `<div class="flex items-center">
        <svg class="h-8 w-8 ${iconColor} mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clip-rule="evenodd"/>
        </svg>
        <div>
          <div class="text-sm font-medium text-gray-900">${title}</div>
          <div class="text-sm text-gray-500">${filename}</div>
        </div>
      </div>`;
    },
    meta: {
      className: options.className,
    },
  }),

  // Actions column
  actions: <TData extends BaseTableData>(
    actions: TableActions<TData>,
    options: {
      className?: string;
    } = {}
  ): ColumnDef<TData> => ({
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: (info) => {
      const row = info.row.original;
      const actionButtons: string[] = [];
      
      if (actions.onView) {
        actionButtons.push(`<button class="text-blue-600 hover:text-blue-900 text-sm font-medium" data-action="view" data-id="${row.id}">View</button>`);
      }
      
      if (actions.onEdit) {
        actionButtons.push(`<button class="text-yellow-600 hover:text-yellow-900 text-sm font-medium" data-action="edit" data-id="${row.id}">Edit</button>`);
      }
      
      if (actions.onDelete) {
        actionButtons.push(`<button class="text-red-600 hover:text-red-900 text-sm font-medium" data-action="delete" data-id="${row.id}">Delete</button>`);
      }
      
      if (actions.customActions) {
        actions.customActions.forEach(action => {
          const colorClass = action.variant === 'danger' ? 'text-red-600 hover:text-red-900' :
                           action.variant === 'primary' ? 'text-blue-600 hover:text-blue-900' :
                           'text-gray-600 hover:text-gray-900';
          actionButtons.push(`<button class="${colorClass} text-sm font-medium" data-action="custom-${action.label.toLowerCase()}" data-id="${row.id}">${action.label}</button>`);
        });
      }
      
      return `<div class="flex items-center space-x-2">${actionButtons.join('')}</div>`;
    },
    meta: {
      className: options.className,
    },
  }),

  // Selection column (checkbox)
  select: <TData extends BaseTableData>(
    options: {
      className?: string;
    } = {}
  ): ColumnDef<TData> => ({
    id: 'select',
    header: ({ table }) => `
      <input 
        type="checkbox" 
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        ${table.getIsAllRowsSelected() ? 'checked' : ''}
        data-action="select-all"
      />
    `,
    cell: ({ row }) => `
      <input 
        type="checkbox" 
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        ${row.getIsSelected() ? 'checked' : ''}
        data-action="select-row" 
        data-id="${row.original.id}"
      />
    `,
    enableSorting: false,
    size: 50,
    meta: {
      className: options.className,
    },
  }),
};

// Predefined column sets for common use cases
export const commonColumns = {
  // Document management columns
  documentColumns: <TData extends BaseTableData & { 
    title: string; 
    filename: string; 
    category: string; 
    status: string; 
    createdAt: string;
    iconColor?: string;
  }>(actions?: TableActions<TData>) => [
    columnHelpers.document<TData>('title', 'filename', 'Document', { iconColorAccessor: 'iconColor' }),
    columnHelpers.badge<TData>('category', 'Category', { variantMap: categoryBadgeMap }),
    columnHelpers.badge<TData>('status', 'Status', { variantMap: statusBadgeMap }),
    columnHelpers.date<TData>('createdAt', 'Created', { format: 'short' }),
    ...(actions ? [columnHelpers.actions<TData>(actions)] : []),
  ],
};

export default columnHelpers;