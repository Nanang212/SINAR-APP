import type { ColumnDef, TableOptions } from '@tanstack/svelte-table';

// Base table data interface
export interface BaseTableData {
  id: string;
  [key: string]: any;
}

// Table configuration interface
export interface TableConfig<TData extends BaseTableData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  options?: Partial<TableOptions<TData>>;
}

// Pagination state
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

// Sorting state
export interface SortingState {
  id: string;
  desc: boolean;
}[]

// Column visibility state
export interface VisibilityState {
  [columnId: string]: boolean;
}

// Filtering state
export interface ColumnFiltersState {
  id: string;
  value: unknown;
}[]

// Global filter state
export interface GlobalFilterState {
  value: string | undefined;
}

// Table state interface
export interface TableState {
  pagination: PaginationState;
  sorting: SortingState;
  columnVisibility: VisibilityState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  rowSelection: Record<string, boolean>;
}

// Table actions interface
export interface TableActions<TData extends BaseTableData> {
  onRowClick?: (row: TData) => void;
  onRowSelect?: (rows: TData[]) => void;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onView?: (row: TData) => void;
  customActions?: Array<{
    label: string;
    icon?: string;
    action: (row: TData) => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

// Table configuration with all options
export interface FullTableConfig<TData extends BaseTableData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  initialState?: Partial<TableState>;
  actions?: TableActions<TData>;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  stickyHeader?: boolean;
  pageSize?: number;
  className?: string;
}

// Column definition helpers
export interface ColumnDefHelpers {
  text: (accessor: string, header: string, options?: any) => ColumnDef<any>;
  badge: (accessor: string, header: string, variant?: 'default' | 'success' | 'warning' | 'danger') => ColumnDef<any>;
  date: (accessor: string, header: string, format?: string) => ColumnDef<any>;
  actions: (actions: TableActions<any>) => ColumnDef<any>;
}