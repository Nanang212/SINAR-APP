import { writable, derived, type Readable } from 'svelte/store';
import {
  createSvelteTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type Table,
  type ColumnDef
} from '@tanstack/svelte-table';
import type { 
  BaseTableData, 
  FullTableConfig, 
  TableState, 
  PaginationState,
  SortingState,
  ColumnFiltersState 
} from './types';

export function createTableStore<TData extends BaseTableData>(config: FullTableConfig<TData>) {
  // Initial state
  const initialState: TableState = {
    pagination: { pageIndex: 0, pageSize: config.pageSize || 10 },
    sorting: [],
    columnVisibility: {},
    columnFilters: [],
    globalFilter: '',
    rowSelection: {},
    ...config.initialState
  };

  // Create reactive stores for table state
  const pagination = writable<PaginationState>(initialState.pagination);
  const sorting = writable<SortingState>(initialState.sorting);
  const columnFilters = writable<ColumnFiltersState>(initialState.columnFilters);
  const globalFilter = writable<string>(initialState.globalFilter);
  const columnVisibility = writable<Record<string, boolean>>(initialState.columnVisibility);
  const rowSelection = writable<Record<string, boolean>>(initialState.rowSelection);
  const data = writable<TData[]>(config.data);

  // Create the table instance
  const table = derived(
    [data, pagination, sorting, columnFilters, globalFilter, columnVisibility, rowSelection],
    ([$data, $pagination, $sorting, $columnFilters, $globalFilter, $columnVisibility, $rowSelection]) => {
      return createSvelteTable({
        data: $data,
        columns: config.columns,
        state: {
          pagination: $pagination,
          sorting: $sorting,
          columnFilters: $columnFilters,
          globalFilter: $globalFilter,
          columnVisibility: $columnVisibility,
          rowSelection: $rowSelection,
        },
        onPaginationChange: (updater) => {
          pagination.update(prev => 
            typeof updater === 'function' ? updater(prev) : updater
          );
        },
        onSortingChange: (updater) => {
          sorting.update(prev => 
            typeof updater === 'function' ? updater(prev) : updater
          );
        },
        onColumnFiltersChange: (updater) => {
          columnFilters.update(prev => 
            typeof updater === 'function' ? updater(prev) : updater
          );
        },
        onGlobalFilterChange: (updater) => {
          globalFilter.update(prev => 
            typeof updater === 'function' ? updater(prev) : updater
          );
        },
        onColumnVisibilityChange: (updater) => {
          columnVisibility.update(prev => 
            typeof updater === 'function' ? updater(prev) : updater
          );
        },
        onRowSelectionChange: (updater) => {
          rowSelection.update(prev => 
            typeof updater === 'function' ? updater(prev) : updater
          );
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: config.enableSorting !== false ? getSortedRowModel() : undefined,
        getFilteredRowModel: config.enableFiltering !== false ? getFilteredRowModel() : undefined,
        getPaginationRowModel: config.enablePagination !== false ? getPaginationRowModel() : undefined,
        enableRowSelection: config.enableRowSelection || false,
        autoResetPageIndex: false,
      });
    }
  );

  // Helper functions
  const updateData = (newData: TData[]) => {
    data.set(newData);
  };

  const resetFilters = () => {
    columnFilters.set([]);
    globalFilter.set('');
  };

  const resetSorting = () => {
    sorting.set([]);
  };

  const resetPagination = () => {
    pagination.update(prev => ({ ...prev, pageIndex: 0 }));
  };

  const setPageSize = (size: number) => {
    pagination.update(prev => ({ ...prev, pageSize: size, pageIndex: 0 }));
  };

  const setGlobalFilter = (filter: string) => {
    globalFilter.set(filter);
    resetPagination();
  };

  const toggleColumnVisibility = (columnId: string) => {
    columnVisibility.update(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const getSelectedRows = (): Readable<TData[]> => {
    return derived([table, rowSelection], ([$table, $rowSelection]) => {
      return $table.getSelectedRowModel().rows.map(row => row.original);
    });
  };

  const clearSelection = () => {
    rowSelection.set({});
  };

  return {
    // Stores
    table,
    data,
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    columnVisibility,
    rowSelection,
    
    // Actions
    updateData,
    resetFilters,
    resetSorting,
    resetPagination,
    setPageSize,
    setGlobalFilter,
    toggleColumnVisibility,
    getSelectedRows,
    clearSelection,
    
    // State getters
    getState: () => ({
      pagination: pagination,
      sorting: sorting,
      columnFilters: columnFilters,
      globalFilter: globalFilter,
      columnVisibility: columnVisibility,
      rowSelection: rowSelection,
    }),
  };
}

export type TableStore<TData extends BaseTableData> = ReturnType<typeof createTableStore<TData>>;