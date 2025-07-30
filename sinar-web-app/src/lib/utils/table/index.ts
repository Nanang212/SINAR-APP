// Export all table utilities
export * from './types';
export * from './store';
export * from './columnHelpers';

// Export Table component
export { default as Table } from '@/lib/components/ui/Table.svelte';

// Re-export TanStack Table types that might be useful
export type {
  ColumnDef,
  Table as TanStackTable,
  Row,
  Cell,
  Header,
  HeaderGroup,
} from '@tanstack/svelte-table';