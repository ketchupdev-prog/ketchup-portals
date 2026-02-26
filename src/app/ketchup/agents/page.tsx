'use client';

/**
 * Agents list – Ketchup Portal (PRD §3.2.4).
 * Data from GET /api/v1/agents; filters (region/address, status); row click to detail.
 */

import { useState, useEffect, useMemo } from 'react';
import { AgentTable, type AgentRow } from '@/components/ketchup/agent-table';

export default function AgentsPage() {
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AgentRow[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (regionFilter) params.set('region', regionFilter);
    if (statusFilter) params.set('status', statusFilter);
    setLoading(true);
    fetch(`/api/v1/agents?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        const list = (json.data ?? []).map((a: { id: string; name: string; address?: string | null; float_balance?: string | null; status: string }) => ({
          id: a.id,
          name: a.name,
          location: a.address ?? '—',
          floatBalance: a.float_balance != null ? `NAD ${a.float_balance}` : '—',
          lastTransaction: '—',
          terminalId: '—',
          status: a.status ?? 'active',
        }));
        setData(list);
      })
      .finally(() => setLoading(false));
  }, [regionFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <AgentTable
        data={data}
        loading={loading}
        regionFilter={regionFilter}
        statusFilter={statusFilter}
        onRegionFilterChange={setRegionFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </div>
  );
}
