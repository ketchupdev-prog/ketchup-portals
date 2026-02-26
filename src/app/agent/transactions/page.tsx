'use client';

/**
 * Agent Transactions – PRD §5.2.x.
 * Resolves agent_id from GET /api/v1/agents?limit=1, then loads transactions.
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

type TxRow = { id: string; type: string; amount: string; time: string; method: string };

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AgentTransactionsPage() {
  const { addToast } = useToast();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/agents?limit=1')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return null;
        return json.data?.[0]?.id ?? null;
      })
      .then((id) => {
        if (cancelled || !id) return null;
        setAgentId(id);
        return fetch(`/api/v1/agent/transactions?agent_id=${id}&page=${page}&limit=20`);
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

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount' },
    { key: 'method', header: 'Method' },
    { key: 'time', header: 'Time' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Transactions"
        description="Full transaction history for this agent (demo agent until auth)."
      />
      <Card>
        <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-content-muted">Loading…</p>}
          {!loading && (
            <>
              <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} emptyMessage="No transactions." />
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-content-muted">Page {page} of {totalPages} ({totalRecords} total)</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
