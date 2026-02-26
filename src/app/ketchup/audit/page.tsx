'use client';

/**
 * Audit Logs – Ketchup Portal (PRD §3.2.7).
 * Data from GET /api/v1/audit-logs; filter by user, action, date; export CSV.
 */

import { useState, useMemo, useEffect } from 'react';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

type AuditRow = { id: string; user: string; action: string; date: string; details: string };

const COLS = [
  { key: 'user', header: 'User' },
  { key: 'action', header: 'Action' },
  { key: 'date', header: 'Date' },
  { key: 'details', header: 'Details' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'suspended', label: 'Beneficiary suspended' },
  { value: 'Reconciliation', label: 'Reconciliation' },
  { value: 'Voucher', label: 'Voucher' },
  { value: 'Agent', label: 'Agent' },
];

function exportCSV(rows: AuditRow[], filename: string) {
  const header = COLS.map((c) => c.header).join(',');
  const body = rows.map((r) => COLS.map((c) => String((r as Record<string, string>)[c.key] ?? '')).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function mapApiToRow(r: { id: string; user_id: string; action: string; entity_type: string | null; entity_id: string | null; created_at: string }): AuditRow {
  const date = r.created_at.slice(0, 19).replace('T', ' ');
  const details = [r.entity_type, r.entity_id].filter(Boolean).join(' ') || '—';
  return { id: r.id, user: r.user_id ?? '—', action: r.action ?? '—', date, details };
}

export default function AuditPage() {
  const { addToast } = useToast();
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AuditRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '500' });
    if (actionFilter) params.set('action', actionFilter);
    fetch(`/api/v1/audit-logs?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) setData(json.data.map(mapApiToRow));
        else setData([]);
      })
      .catch(() => { if (!cancelled) { setData([]); addToast('Failed to load audit logs.', 'error'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [actionFilter, addToast]);

  const filteredData = useMemo(() => {
    let list = [...data];
    if (userFilter) list = list.filter((r) => r.user.toLowerCase().includes(userFilter.toLowerCase()));
    if (dateFrom) list = list.filter((r) => r.date >= dateFrom);
    if (dateTo) list = list.filter((r) => r.date <= dateTo + ' 23:59:59');
    return list;
  }, [data, userFilter, dateFrom, dateTo]);

  const handleExportCSV = () => {
    exportCSV(filteredData, `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    addToast('Audit log exported.', 'success');
  };

  return (
    <div className="space-y-6">
      <SearchHeader
        title="Audit logs"
        searchPlaceholder="Search by user..."
        searchValue={userFilter}
        onSearchChange={setUserFilter}
        action={
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            Export CSV
          </Button>
        }
      />
      <div className="flex flex-wrap gap-3 items-end">
        <Select
          options={ACTION_OPTIONS}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          inputSize="sm"
          className="w-48"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="input-sm w-40"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="input-sm w-40"
        />
      </div>
      <DataTable
        columns={COLS}
        data={filteredData}
        keyExtractor={(r) => r.id}
        emptyMessage={loading ? 'Loading…' : 'No audit logs match your filters.'}
      />
    </div>
  );
}
