'use client';

/**
 * FloatHistory – Agent float top-up and adjustment history. PRD §5.2.2.
 * Location: src/components/agent/float-history.tsx
 * Uses: Card, DataTable.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

export interface FloatHistoryRow {
  id: string;
  date: string;
  type: string;
  amount: string;
  reference: string;
}

export interface FloatHistoryProps {
  data: FloatHistoryRow[];
  loading?: boolean;
  className?: string;
}

const COLS = [
  { key: 'date', header: 'Date' },
  { key: 'type', header: 'Type' },
  { key: 'amount', header: 'Amount' },
  { key: 'reference', header: 'Reference' },
];

export function FloatHistory({ data, loading = false, className = '' }: FloatHistoryProps) {
  return (
    <Card className={className}>
      <CardHeader><CardTitle>Float history</CardTitle></CardHeader>
      <CardContent>
        <DataTable
          columns={COLS}
          data={data}
          keyExtractor={(r) => r.id}
          emptyMessage={loading ? 'Loading…' : 'No history.'}
        />
      </CardContent>
    </Card>
  );
}
