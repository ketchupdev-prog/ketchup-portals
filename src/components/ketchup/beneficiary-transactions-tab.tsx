'use client';

/**
 * BeneficiaryTransactionsTab – Transaction history for a beneficiary (PRD §3.2.2 Detail View).
 * Location: src/components/ketchup/beneficiary-transactions-tab.tsx
 */

import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TransactionRow {
  id: string;
  date: string;
  type: string;
  amount: string;
  reference: string;
}

interface BeneficiaryTransactionsTabProps {
  beneficiaryId: string;
  transactions: TransactionRow[];
}

const COLS = [
  { key: 'date', header: 'Date' },
  { key: 'type', header: 'Type' },
  { key: 'amount', header: 'Amount' },
  { key: 'reference', header: 'Reference' },
];

export function BeneficiaryTransactionsTab({ transactions }: BeneficiaryTransactionsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction history</CardTitle>
        <p className="text-sm text-content-muted">Redemptions and wallet activity.</p>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={COLS}
          data={transactions}
          keyExtractor={(r) => r.id}
          emptyMessage="No transactions."
        />
      </CardContent>
    </Card>
  );
}
