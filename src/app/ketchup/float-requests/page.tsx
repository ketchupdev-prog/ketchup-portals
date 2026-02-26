'use client';

/**
 * Float Requests – Ketchup Portal (PRD §3.2.4, §7.4.1).
 * List agent float top-up requests; approve or reject (sends SMS + in-app notification).
 * Location: src/app/ketchup/float-requests/page.tsx
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

interface FloatRequestRow {
  id: string;
  agent_id: string;
  agent_name: string;
  amount: string;
  status: string;
  requested_at: string | null;
  reviewed_at: string | null;
}

const COLS = [
  { key: 'agent_name', header: 'Agent' },
  { key: 'amount', header: 'Amount (NAD)' },
  { key: 'status', header: 'Status' },
  { key: 'requested_at', header: 'Requested' },
  { key: 'actions', header: '' },
];

export default function FloatRequestsPage() {
  const { addToast } = useToast();
  const [data, setData] = useState<FloatRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/v1/float-requests?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setData(json.data ?? []);
      else addToast(json.error ?? 'Failed to load', 'error');
    } catch {
      addToast('Failed to load float requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setActingId(id);
    try {
      const res = await fetch(`/api/v1/agent/float/request/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (res.ok) {
        addToast(`Request ${status}.`, 'success');
        fetchData();
      } else {
        addToast(json.error ?? 'Action failed', 'error');
      }
    } catch {
      addToast('Action failed', 'error');
    } finally {
      setActingId(null);
    }
  };

  const tableRows = data.map((r) => ({
    ...r,
    amount: r.amount,
    requested_at: r.requested_at ? new Date(r.requested_at).toLocaleString() : '—',
    actions:
      r.status === 'pending' ? (
        <div className="flex gap-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReview(r.id, 'approved')}
            disabled={actingId !== null}
          >
            Approve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-error"
            onClick={() => handleReview(r.id, 'rejected')}
            disabled={actingId !== null}
          >
            Reject
          </Button>
        </div>
      ) : (
        <span className="text-content-muted text-sm">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : ''}</span>
      ),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Float requests"
        description="Approve or reject agent float top-up requests. Agent receives SMS and in-app notification."
        action={
          <Select
            label=""
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        }
      />
      <DataTable
        columns={COLS}
        data={tableRows}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage={loading ? 'Loading…' : 'No float requests.'}
      />
    </div>
  );
}
