'use client';

/**
 * BeneficiaryAdvanceLedgerTab – Advance ledger for a beneficiary (PRD §3.2.11, §3.3.11).
 * Outstanding advances from duplicate redemptions; recovery schedule. Data from GET /api/v1/portal/beneficiaries/:id/advance-ledger.
 * Location: src/components/ketchup/beneficiary-advance-ledger-tab.tsx
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { MetricCard } from '@/components/ui/metric-card';

interface AdvanceRow {
  id: string;
  source_event_id: string;
  programme_name: string | null;
  original_amount: string;
  recovered_amount: string;
  outstanding_amount: string;
  cycles_outstanding: number;
  status: string;
  created_at: string;
}

interface BeneficiaryAdvanceLedgerTabProps {
  beneficiaryId: string;
}

const COLS = [
  { key: 'source_event_id', header: 'Source event' },
  { key: 'programme_name', header: 'Programme' },
  { key: 'original_amount', header: 'Original (NAD)' },
  { key: 'recovered_amount', header: 'Recovered (NAD)' },
  { key: 'outstanding_amount', header: 'Outstanding (NAD)' },
  { key: 'status', header: 'Status' },
];

export function BeneficiaryAdvanceLedgerTab({ beneficiaryId }: BeneficiaryAdvanceLedgerTabProps) {
  const [loading, setLoading] = useState(true);
  const [advances, setAdvances] = useState<AdvanceRow[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState('0');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/beneficiaries/${beneficiaryId}/advance-ledger`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setAdvances(json.advances ?? []);
        setTotalOutstanding(json.total_outstanding_nad ?? '0');
      })
      .catch(() => {
        if (!cancelled) {
          setAdvances([]);
          setTotalOutstanding('0');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [beneficiaryId]);

  const tableData = advances.map((a) => ({
    ...a,
    source_event_id: a.source_event_id.slice(0, 8),
    original_amount: `NAD ${a.original_amount}`,
    recovered_amount: `NAD ${a.recovered_amount}`,
    outstanding_amount: `NAD ${a.outstanding_amount}`,
  }));

  return (
    <div className="space-y-4">
      <MetricCard
        title="Total outstanding advance (NAD)"
        value={`NAD ${Number(totalOutstanding).toLocaleString()}`}
        variant={Number(totalOutstanding) > 0 ? 'warning' : 'success'}
      />
      <Card>
        <CardHeader>
          <CardTitle>Advance ledger</CardTitle>
          <p className="text-sm text-content-muted">
            Over-disbursements from duplicate redemptions; recovered in future cycles.
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={COLS}
            data={tableData}
            keyExtractor={(r) => r.id}
            loading={loading}
            emptyMessage={loading ? 'Loading…' : 'No advance ledger entries.'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
