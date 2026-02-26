'use client';

/**
 * TrustReconciliation – Ketchup trust account reconciliation view. PRD §3.3.6.
 * Location: src/components/ketchup/trust-reconciliation.tsx
 * Uses: SectionHeader, Card, DescriptionList, DataTable, Button.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

export interface TrustReconciliationRow {
  id: string;
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

export interface TrustReconciliationProps {
  summary?: { totalCredits: string; totalDebits: string; balance: string };
  entries?: TrustReconciliationRow[];
  loading?: boolean;
  onExport?: () => void;
  className?: string;
}

export function TrustReconciliation({
  summary = { totalCredits: 'NAD 0', totalDebits: 'NAD 0', balance: 'NAD 0' },
  entries = [],
  loading = false,
  onExport,
  className = '',
}: TrustReconciliationProps) {
  const cols = [
    { key: 'date', header: 'Date' },
    { key: 'description', header: 'Description' },
    { key: 'debit', header: 'Debit' },
    { key: 'credit', header: 'Credit' },
    { key: 'balance', header: 'Balance' },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Trust reconciliation" description="Trust account movements and balance." />
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          {onExport && <Button size="sm" variant="outline" onClick={onExport}>Export</Button>}
        </CardHeader>
        <CardContent>
          <DescriptionList
            items={[
              { term: 'Total credits', description: summary.totalCredits },
              { term: 'Total debits', description: summary.totalDebits },
              { term: 'Balance', description: summary.balance },
            ]}
            layout="stack"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Entries</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={cols} data={entries} keyExtractor={(r) => r.id} emptyMessage={loading ? 'Loading…' : 'No entries.'} />
        </CardContent>
      </Card>
    </div>
  );
}
