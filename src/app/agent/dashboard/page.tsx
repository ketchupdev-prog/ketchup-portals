'use client';

/**
 * Agent Dashboard – PRD §5.2.1.
 * Resolves agent_id from GET /api/v1/agents?limit=1, then loads dashboard data.
 */

import { useState, useEffect } from 'react';
import { AgentDashboard as AgentDashboardComponent } from '@/components/agent/agent-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Alert } from '@/components/ui/alert';

type TxRow = { id: string; type: string; amount: string; beneficiary: string; time: string };

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function AgentDashboardPage() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [floatBalance, setFloatBalance] = useState('NAD 0');
  const [parcelCount, setParcelCount] = useState(0);
  const [transactions, setTransactions] = useState<TxRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/agents?limit=1')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const id = json.data?.[0]?.id ?? null;
        setAgentId(id);
        if (!id) return;
        return fetch(`/api/v1/agent/dashboard?agent_id=${id}`);
      })
      .then((res) => res && !cancelled ? res.json() : null)
      .then((json) => {
        if (cancelled || !json) return;
        setFloatBalance(json.float_balance != null ? `NAD ${Number(json.float_balance).toLocaleString()}` : 'NAD 0');
        setParcelCount(json.parcels_ready ?? 0);
        const list = (json.recent_transactions ?? []).slice(0, 5).map((t: { id: string; type: string; amount: string; timestamp: string }) => ({
          id: t.id,
          type: t.type ?? '—',
          amount: t.amount != null ? `NAD ${t.amount}` : '—',
          beneficiary: '—',
          time: t.timestamp ? formatTime(t.timestamp) : '—',
        }));
        setTransactions(list);
      })
      .catch(() => { if (!cancelled) setTransactions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const showLowFloat = !loading && Number(floatBalance.replace(/[^0-9.]/g, '')) < 500;

  return (
    <div className="space-y-6">
      <AgentDashboardComponent floatBalance={floatBalance} parcelCount={parcelCount} />
      <Card>
        <CardHeader><CardTitle>Recent transactions (last 5)</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={[{ key: 'type', header: 'Type' }, { key: 'amount', header: 'Amount' }, { key: 'beneficiary', header: 'Beneficiary' }, { key: 'time', header: 'Time' }]}
            data={transactions}
            keyExtractor={(r) => r.id}
            emptyMessage={loading ? 'Loading…' : 'No recent transactions.'}
          />
        </CardContent>
      </Card>
      {showLowFloat && <Alert variant="warning" title="Low float">Float below N$500. Request top-up.</Alert>}
    </div>
  );
}
