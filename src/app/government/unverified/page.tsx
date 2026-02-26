'use client';

/**
 * Government – Unverified beneficiaries (PRD §4.2.2).
 * Data from GET /api/v1/beneficiaries/unverified; filter by region; export CSV.
 */

import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { UnverifiedList, type UnverifiedRow } from '@/components/government';
import { normalizeRegion } from '@/lib/regions';

function daysOverdue(dueDateIso: string | null): number {
  if (!dueDateIso) return 0;
  const due = new Date(dueDateIso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000)));
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
    fetch('/api/v1/beneficiaries/unverified?page=1&limit=500', { credentials: 'include' })
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

  const filtered = useMemo(
    () =>
      !regionFilter
        ? data
        : data.filter((r) => normalizeRegion(r.region) === regionFilter || r.region === regionFilter),
    [data, regionFilter]
  );

  const handleExport = () => {
    const header = 'name,region,programme,daysOverdue';
    const body = filtered.map((r) => [r.name, r.region, r.programme, r.daysOverdue].join(',')).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unverified-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported.', 'success');
  };

  return (
    <UnverifiedList
      data={filtered}
      loading={loading}
      regionFilter={regionFilter}
      onRegionFilterChange={setRegionFilter}
      onExportCSV={handleExport}
    />
  );
}
