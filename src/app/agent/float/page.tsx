'use client';

/**
 * Agent Float Management – PRD §5.2.2.
 * Data from GET /api/v1/agent/float and GET /api/v1/agent/float/history; POST float/request for top-up.
 * Uses: FloatHistory, FloatRequestForm.
 */

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloatHistory, FloatRequestForm, type FloatHistoryRow } from '@/components/agent';
import { useToast } from '@/components/ui/toast';

export default function AgentFloatPage() {
  const { addToast } = useToast();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState('NAD 0');
  const [history, setHistory] = useState<FloatHistoryRow[]>([]);

  const loadBalance = useCallback(() => {
    if (!agentId) return;
    fetch(`/api/v1/agent/float?agent_id=${agentId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => setBalance(json.float_balance != null ? `NAD ${Number(json.float_balance).toLocaleString()}` : 'NAD 0'))
      .catch(() => setBalance('NAD 0'));
  }, [agentId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/agents?limit=1', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return null;
        const id = json.data?.[0]?.id ?? null;
        setAgentId(id);
        return id as string | null;
      })
      .then((id) => {
        if (cancelled || !id) return;
        return Promise.all([
          fetch(`/api/v1/agent/float?agent_id=${id}`, { credentials: 'include' }).then((r) => r.json()),
          fetch(`/api/v1/agent/float/history?agent_id=${id}&page=1&limit=50`, { credentials: 'include' }).then((r) => r.json()),
        ]);
      })
      .then((results) => {
        if (cancelled || !results) return;
        const [floatJson, historyJson] = results;
        setBalance(floatJson?.float_balance != null ? `NAD ${Number(floatJson.float_balance).toLocaleString()}` : 'NAD 0');
        if (historyJson?.data && Array.isArray(historyJson.data)) {
          setHistory(historyJson.data.map((r: { id: string; type: string; amount: string; reference: string | null; created_at: string }) => ({
            id: r.id,
            date: r.created_at.slice(0, 10),
            type: r.type ?? '—',
            amount: r.amount != null ? `NAD ${Number(r.amount).toLocaleString()}` : '—',
            reference: r.reference ?? '—',
          })));
        } else setHistory([]);
      })
      .catch(() => { if (!cancelled) setHistory([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleRequest = async (amount: number) => {
    if (!agentId) { addToast('No agent loaded.', 'error'); return; }
    try {
      const res = await fetch('/api/v1/agent/float/request', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, amount }),
      });
      const json = await res.json();
      if (!res.ok) { addToast(json.error ?? 'Request failed.', 'error'); return; }
      addToast('Top-up request submitted. Ketchup ops will be notified.', 'success');
      loadBalance();
    } catch { addToast('Request failed.', 'error'); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Float management" description="Current balance, history, request top-up." />
      <MetricCard title="Current float balance" value={balance} variant="primary" />
      <div className="flex gap-2">
        <Button onClick={() => setModalOpen(true)}>Request top-up</Button>
      </div>
      <FloatHistory data={history} loading={loading} />
      <Card>
        <CardHeader><CardTitle>Settlement statement</CardTitle></CardHeader>
        <CardContent>
          <p className="text-content-muted text-sm">Daily summary of commissions; download as CSV.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={async () => {
            if (!agentId) { addToast('No agent loaded.', 'error'); return; }
            try {
              const res = await fetch(`/api/v1/agent/settlement?agent_id=${agentId}`, { credentials: 'include' });
              const json = await res.json();
              const date = json.date ?? new Date().toISOString().slice(0, 10);
              const csv = `date,agent_id,total_cashout,total_fees,transaction_count\n${date},${json.agent_id ?? agentId},${json.total_cashout ?? '0'},${json.total_fees ?? '0'},${json.transaction_count ?? 0}`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `settlement-${date}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              addToast('Settlement CSV downloaded.', 'success');
            } catch {
              addToast('Failed to download settlement.', 'error');
            }
          }}>Download CSV</Button>
        </CardContent>
      </Card>
      <FloatRequestForm open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleRequest} />
    </div>
  );
}
