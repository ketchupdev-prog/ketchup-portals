'use client';

/**
 * TransactionHistory – Agent transaction list with pagination. PRD §5.2.x.
 * Location: src/components/agent/transaction-history.tsx
 * Uses: Card, DataTable, Button.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

export interface TransactionHistoryRow {
  id: string;
  type: string;
  amount: string;
  time: string;
  method: string;
}

export interface TransactionHistoryProps {
  data: TransactionHistoryRow[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

const COLS = [
  { key: 'id', header: 'ID' },
  { key: 'type', header: 'Type' },
  { key: 'amount', header: 'Amount' },
  { key: 'method', header: 'Method' },
  { key: 'time', header: 'Time' },
];

export function TransactionHistory({
  data,
  loading = false,
  page = 1,
  totalPages = 1,
  totalRecords = 0,
  onPageChange,
  className = '',
}: TransactionHistoryProps) {
  return (
    <Card className={className}>
      <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
      <CardContent>
        <DataTable columns={COLS} data={data} keyExtractor={(r) => r.id} emptyMessage={loading ? 'Loading…' : 'No transactions.'} />
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-base-content/70">Page {page} of {totalPages} ({totalRecords} total)</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
