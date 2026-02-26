'use client';

/**
 * BeneficiaryVouchersTab – Vouchers list for a beneficiary (PRD §3.2.2 Detail View).
 * Location: src/components/ketchup/beneficiary-vouchers-tab.tsx
 */

import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface VoucherRow {
  id: string;
  code: string;
  amount: string;
  status: string;
  issuedAt: string;
  redeemedAt?: string;
}

interface BeneficiaryVouchersTabProps {
  beneficiaryId: string;
  vouchers: VoucherRow[];
}

const COLS = [
  { key: 'code', header: 'Voucher code' },
  { key: 'amount', header: 'Amount' },
  { key: 'status', header: 'Status' },
  { key: 'issuedAt', header: 'Issued' },
  { key: 'redeemedAt', header: 'Redeemed' },
];

export function BeneficiaryVouchersTab({ beneficiaryId: _beneficiaryId, vouchers }: BeneficiaryVouchersTabProps) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vouchers</CardTitle>
        <p className="text-sm text-content-muted">Vouchers issued to this beneficiary.</p>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={COLS}
          data={vouchers}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`/ketchup/vouchers/${r.id}`)}
          emptyMessage="No vouchers for this beneficiary."
        />
      </CardContent>
    </Card>
  );
}
