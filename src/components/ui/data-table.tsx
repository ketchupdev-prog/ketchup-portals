'use client';

import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, data, keyExtractor, loading, emptyMessage = 'No data', onRowClick, className } = props;
  if (loading) {
    return (
      <div className={cn('overflow-x-auto', className)}>
        <table className="table table-zebra">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.header}</th>)}</tr></thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i}>{columns.map((c) => <td key={c.key}><div className="skeleton h-4 w-full" /></td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (data.length === 0) {
    return <div className={cn('text-center py-8 text-content-muted', className)}>{emptyMessage}</div>;
  }
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="table table-zebra">
        <thead><tr>{columns.map((c) => <th key={c.key}>{c.header}</th>)}</tr></thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(onRowClick && 'cursor-pointer hover:bg-base-200')}
            >
              {columns.map((c) => (
                <td key={c.key}>
                  {c.cell ? c.cell(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
