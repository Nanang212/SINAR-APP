<script lang="ts">
  import { onMount } from 'svelte';
  import { flexRender } from '@tanstack/svelte-table';
  import type { BaseTableData, FullTableConfig, TableActions } from '@/lib/utils/table/types';
  import { createTableStore } from '@/lib/utils/table/store';
  import { cn } from '@/lib/utils';

  interface $$Props<TData extends BaseTableData = BaseTableData> {
    config: FullTableConfig<TData>;
    className?: string;
  }

  let { config, className }: $$Props = $props();

  // Create table store
  const tableStore = createTableStore(config);
  const { table, globalFilter, pagination } = tableStore;

  let tableElement: HTMLTableElement;

  // Handle action clicks
  function handleActionClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' && target.dataset.action) {
      const action = target.dataset.action;
      const id = target.dataset.id;
      
      if (!id) return;
      
      const rowData = config.data.find(item => item.id === id);
      if (!rowData) return;

      switch (action) {
        case 'view':
          config.actions?.onView?.(rowData);
          break;
        case 'edit':
          config.actions?.onEdit?.(rowData);
          break;
        case 'delete':
          config.actions?.onDelete?.(rowData);
          break;
        case 'select-row':
          // Handle row selection
          break;
        case 'select-all':
          // Handle select all
          break;
        default:
          // Handle custom actions
          if (action.startsWith('custom-')) {
            const customActionName = action.replace('custom-', '');
            const customAction = config.actions?.customActions?.find(
              a => a.label.toLowerCase() === customActionName
            );
            customAction?.action(rowData);
          }
      }
    }
  }

  onMount(() => {
    if (tableElement) {
      tableElement.addEventListener('click', handleActionClick);
      return () => {
        tableElement.removeEventListener('click', handleActionClick);
      };
    }
  });

  // Update data when config changes
  $effect(() => {
    if (config.data) {
      tableStore.updateData(config.data);
    }
  });
</script>

<div class={cn('w-full', className)}>
  <!-- Global Search -->
  {#if config.enableFiltering !== false}
    <div class="mb-4">
      <div class="relative">
        <input
          type="text"
          bind:value={$globalFilter}
          placeholder="Search all columns..."
          class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-sm"
        />
        <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    </div>
  {/if}

  <!-- Table -->
  <div class="overflow-x-auto {config.stickyHeader ? 'max-h-[70vh] overflow-y-auto' : ''}">
    <table bind:this={tableElement} class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50 {config.stickyHeader ? 'sticky top-0 z-10' : ''}">
        {#each $table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <tr>
            {#each headerGroup.headers as header (header.id)}
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none {config.stickyHeader ? 'bg-gray-50' : ''}"
                class:hover:bg-gray-100={header.column.getCanSort()}
                onclick={() => header.column.getToggleSortingHandler()?.()}
              >
                <div class="flex items-center space-x-1">
                  <span>
                    {#if !header.isPlaceholder}
                      {@html flexRender(header.column.columnDef.header, header.getContext())}
                    {/if}
                  </span>
                  {#if header.column.getCanSort()}
                    <span class="text-gray-400">
                      {#if header.column.getIsSorted() === 'asc'}
                        ↑
                      {:else if header.column.getIsSorted() === 'desc'}
                        ↓
                      {:else}
                        ↕
                      {/if}
                    </span>
                  {/if}
                </div>
              </th>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each $table.getRowModel().rows as row (row.id)}
          <tr class="hover:bg-gray-50">
            {#each row.getVisibleCells() as cell (cell.id)}
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {@html flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Empty State -->
  {#if $table.getRowModel().rows.length === 0}
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No data found</h3>
      <p class="mt-1 text-sm text-gray-500">
        {$globalFilter ? 'Try adjusting your search terms.' : 'Get started by adding some data.'}
      </p>
    </div>
  {/if}

  <!-- Pagination -->
  {#if config.enablePagination !== false && $table.getPageCount() > 1}
    <div class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-700">
        Showing <span class="font-medium">{$table.getState().pagination.pageIndex * $table.getState().pagination.pageSize + 1}</span> 
        to <span class="font-medium">{Math.min(($table.getState().pagination.pageIndex + 1) * $table.getState().pagination.pageSize, $table.getPrePaginationRowModel().rows.length)}</span> 
        of <span class="font-medium">{$table.getPrePaginationRowModel().rows.length}</span> results
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          onclick={() => $table.setPageIndex(0)}
          disabled={!$table.getCanPreviousPage()}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          First
        </button>
        
        <button
          onclick={() => $table.previousPage()}
          disabled={!$table.getCanPreviousPage()}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <span class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md">
          {$table.getState().pagination.pageIndex + 1}
        </span>
        
        <button
          onclick={() => $table.nextPage()}
          disabled={!$table.getCanNextPage()}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
        
        <button
          onclick={() => $table.setPageIndex($table.getPageCount() - 1)}
          disabled={!$table.getCanNextPage()}
          class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last
        </button>
      </div>
    </div>
  {/if}
</div>