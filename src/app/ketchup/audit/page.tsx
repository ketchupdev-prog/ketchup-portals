'use client';

/**
 * Audit Logs – Ketchup Portal (PRD §3.2.7).
 * Uses AuditLogTable; data from GET /api/v1/audit-logs; filter by user, action, date; export CSV.
 */

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { AuditLogTable, type AuditLogRow } from '@/components/ketchup';
import { useToast } from '@/components/ui/toast';

function mapApiToRow(r: { id: string; user_id: string; action: string; entity_type: string | null; entity_id: string | null; created_at: string }): AuditLogRow {
  const timestamp = r.created_at.slice(0, 19).replace('T', ' ');
  const details = [r.entity_type, r.entity_id].filter(Boolean).join(' ') || '—';
  return { id: r.id, timestamp, actor: r.user_id ?? '—', action: r.action ?? '—', resource: details, details };
}

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'suspended', label: 'Beneficiary suspended' },
  { value: 'Reconciliation', label: 'Reconciliation' },
  { value: 'Voucher', label: 'Voucher' },
  { value: 'Agent', label: 'Agent' },
];

export default function AuditPage() {
  const { addToast } = useToast();
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '500' });
    if (actionFilter) params.set('action', actionFilter);
    fetch(`/api/v1/audit-logs?${params.toString()}`, { credentials: 'include' })
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
    if (userFilter) list = list.filter((r) => r.actor.toLowerCase().includes(userFilter.toLowerCase()));
    if (dateFrom) list = list.filter((r) => r.timestamp >= dateFrom);
    if (dateTo) list = list.filter((r) => r.timestamp <= dateTo + ' 23:59:59');
    return list;
  }, [data, userFilter, dateFrom, dateTo]);

  const handleExportCSV = () => {
    const header = 'timestamp,actor,action,resource,details';
    const body = filteredData.map((r) => [r.timestamp, r.actor, r.action, r.resource, r.details ?? ''].join(',')).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Audit log exported.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <Input
          type="text"
          placeholder="Search by user..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="input-sm w-48"
        />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-sm w-40" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-sm w-40" />
      </div>
      <AuditLogTable
        data={filteredData}
        loading={loading}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        onExport={handleExportCSV}
      />
    </div>
  );
}
