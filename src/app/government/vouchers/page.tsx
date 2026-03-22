'use client';

/**
 * Government – Voucher monitoring (PRD §4.2.3).
 * Data from GET /api/v1/vouchers and GET /api/v1/programmes; filter by programme; export CSV.
 * Duplicate Redemption Metrics (PRD §4.2.3): read-only advance summary from GET /api/v1/portal/advance-ledger/summary.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { portalFetch } from '@/lib/portal-fetch';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { MetricCard } from '@/components/ui/metric-card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { exportToCSV, buildCSVFilename } from '@/lib/export-csv';

type VoucherRow = {
  id: string;
  code: string;
  programme: string;
  amount: string;
  status: string;
  date: string;
};

const COLS = [
  { key: 'code', header: 'Voucher' },
  { key: 'programme', header: 'Programme' },
  { key: 'amount', header: 'Amount' },
  { key: 'status', header: 'Status' },
  { key: 'date', header: 'Date' },
];

const statusMap: Record<string, string> = { available: 'Available', redeemed: 'Redeemed', expired: 'Expired' };

function mapApiToRow(r: {
  id: string;
  programme_name: string | null;
  amount: string;
  status: string;
  issued_at: string;
}): VoucherRow {
  return {
    id: r.id,
    code: r.id.slice(0, 8),
    programme: r.programme_name ?? '—',
    amount: `NAD ${r.amount}`,
    status: statusMap[r.status] ?? r.status,
    date: r.issued_at.slice(0, 10),
  };
}


export default function GovernmentVouchersPage() {
  const { addToast } = useToast();
  const [programmeFilter, setProgrammeFilter] = useState('');
  const [programmes, setProgrammes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VoucherRow[]>([]);
  const [dupSummary, setDupSummary] = useState<{
    total_duplicates_detected?: number;
    total_over_disbursed_nad?: string;
    total_outstanding?: string;
    recovery_rate?: number;
  }>({});

  const fetchDupSummary = useCallback(async () => {
    const params = new URLSearchParams();
    if (programmeFilter) params.set('programme_id', programmeFilter);
    try {
      const res = await portalFetch(`/api/v1/advance-ledger/summary?${params.toString()}`);
      const json = await res.json();
      if (res.ok)
        setDupSummary({
          total_duplicates_detected: json.total_duplicates_detected,
          total_over_disbursed_nad: json.total_over_disbursed_nad,
          total_outstanding: json.total_outstanding,
          recovery_rate: json.recovery_rate,
        });
      else
        setDupSummary({});
    } catch {
      setDupSummary({});
    }
  }, [programmeFilter]);

  useEffect(() => {
    fetchDupSummary();
  }, [fetchDupSummary]);

  useEffect(() => {
    let cancelled = false;
    portalFetch('/api/v1/programmes?page=1&limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setProgrammes(json.data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })));
        }
      })
      .catch(() => { if (!cancelled) setProgrammes([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '500' });
    if (programmeFilter) params.set('programme_id', programmeFilter);
    portalFetch(`/api/v1/vouchers?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setData(json.data.map(mapApiToRow));
        } else {
          setData([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData([]);
          addToast('Failed to load vouchers.', 'error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [programmeFilter, addToast]);

  const filtered = useMemo(() => data, [data]);

  const handleExport = () => {
    exportToCSV(
      filtered,
      COLS.map((c) => ({ key: c.key as keyof VoucherRow, header: c.header })),
      buildCSVFilename('vouchers')
    );
    addToast('Exported.', 'success');
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Voucher monitoring" description="View and export voucher-level data." />
      <SearchHeader title="Vouchers" action={<Button variant="outline" size="sm" onClick={handleExport}>Export</Button>} />
      <Select
        options={[
          { value: '', label: 'All programmes' },
          ...programmes.map((p) => ({ value: p.id, label: p.name })),
        ]}
        value={programmeFilter}
        onChange={(e) => setProgrammeFilter(e.target.value)}
        inputSize="sm"
        className="w-48"
      />
      <DataTable
        columns={COLS}
        data={filtered}
        keyExtractor={(r) => r.id}
        emptyMessage={loading ? 'Loading…' : 'No vouchers.'}
      />
      <SectionHeader
        title="Offline Duplicate Redemptions"
        description="Read-only metrics: duplicates detected, outstanding advances, recovery rate (Ghost Payment Prevention Report)."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Duplicates detected"
          value={dupSummary.total_duplicates_detected ?? 0}
          variant="primary"
        />
        <MetricCard
          title="Outstanding advances (NAD)"
          value={`NAD ${Number(dupSummary.total_outstanding ?? 0).toLocaleString()}`}
          variant="warning"
        />
        <MetricCard
          title="Recovery rate"
          value={`${dupSummary.recovery_rate ?? 0}%`}
          variant="accent"
        />
      </div>
    </div>
  );
}
