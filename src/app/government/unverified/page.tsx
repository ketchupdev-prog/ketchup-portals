'use client';

/**
 * Government – Unverified beneficiaries (PRD §4.2.2).
 * Data from GET /api/v1/beneficiaries/unverified; filter by region; export CSV.
 */

import { useState, useMemo, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

type UnverifiedRow = { id: string; name: string; region: string; programme: string; daysOverdue: number };

const COLS = [
  { key: 'name', header: 'Name' },
  { key: 'region', header: 'Region' },
  { key: 'programme', header: 'Programme' },
  { key: 'daysOverdue', header: 'Days overdue' },
];

function daysOverdue(dueDateIso: string | null): number {
  if (!dueDateIso) return 0;
  const due = new Date(dueDateIso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000)));
}

function exportCSV(rows: UnverifiedRow[], filename: string) {
  const header = COLS.map((c) => c.header).join(',');
  const body = rows.map((r) => COLS.map((c) => String((r as Record<string, unknown>)[c.key] ?? '')).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function mapApiToRow(r: { id: string; full_name: string; region: string | null; proof_of_life_due_date: string | null }): UnverifiedRow {
  return { id: r.id, name: r.full_name ?? '—', region: r.region ?? '—', programme: '—', daysOverdue: daysOverdue(r.proof_of_life_due_date ?? null) };
}

export default function GovernmentUnverifiedPage() {
  const { addToast } = useToast();
  const [regionFilter, setRegionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UnverifiedRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/beneficiaries/unverified?page=1&limit=500')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) setData(json.data.map(mapApiToRow));
        else setData([]);
      })
      .catch(() => { if (!cancelled) { setData([]); addToast('Failed to load unverified beneficiaries.', 'error'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [addToast]);

  const regions = useMemo(() => Array.from(new Set(data.map((r) => r.region).filter(Boolean))).sort(), [data]);
  const filtered = useMemo(() => (regionFilter ? data.filter((r) => r.region === regionFilter) : data), [data, regionFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Unverified beneficiaries" description="Proof-of-life overdue; export for field follow-up." />
      <SearchHeader
        title="Unverified list"
        action={<Button variant="outline" size="sm" onClick={() => { exportCSV(filtered, `unverified-${new Date().toISOString().slice(0, 10)}.csv`); addToast('Exported.', 'success'); }}>Export CSV</Button>}
      />
      <Select
        options={[{ value: '', label: 'All regions' }, ...regions.map((r) => ({ value: r, label: r }))]}
        value={regionFilter}
        onChange={(e) => setRegionFilter(e.target.value)}
        inputSize="sm"
        className="w-40"
      />
      <DataTable columns={COLS} data={filtered} keyExtractor={(r) => r.id} emptyMessage={loading ? 'Loading…' : 'No unverified beneficiaries.'} />
    </div>
  );
}
