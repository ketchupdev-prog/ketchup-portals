'use client';

/**
 * Agent Transactions – PRD §5.2.x.
 * Uses TransactionHistory; resolves agent_id from GET /api/v1/agents?limit=1, then loads from GET /api/v1/agent/transactions.
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { TransactionHistory, type TransactionHistoryRow } from '@/components/agent';
import { useToast } from '@/components/ui/toast';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AgentTransactionsPage() {
  const { addToast } = useToast();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TransactionHistoryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/agents?limit=1', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return null;
        return json.data?.[0]?.id ?? null;
      })
      .then((id) => {
        if (cancelled || !id) return null;
        setAgentId(id);
        return fetch(`/api/v1/agent/transactions?agent_id=${id}&page=${page}&limit=20`, { credentials: 'include' });
      })
      .then((res) => res && !cancelled ? res.json() : null)
      .then((json) => {
        if (cancelled || !json) return;
        const list = (json.data ?? []).map((t: { id: string; type: string; amount: string; timestamp: string; method?: string }) => ({
          id: t.id,
          type: t.type ?? '—',
          amount: t.amount != null ? `NAD ${t.amount}` : '—',
          time: t.timestamp ? formatTime(t.timestamp) : '—',
          method: t.method ?? '—',
        }));
        setRows(list);
        setTotalPages(json.meta?.totalPages ?? 1);
        setTotalRecords(json.meta?.totalRecords ?? 0);
      })
      .catch(() => { if (!cancelled) { setRows([]); addToast('Failed to load transactions.', 'error'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, addToast]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Transactions"
        description="Full transaction history for this agent (demo agent until auth)."
      />
      <TransactionHistory
        data={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setPage}
      />
    </div>
  );
}
