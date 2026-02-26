'use client';

/**
 * Agent detail – Ketchup Portal (PRD §3.2.4).
 * Data from GET /api/v1/agents/[id], transactions, parcels. Adjust float via PATCH agents/[id]/float.
 * Location: src/app/ketchup/agents/[id]/page.tsx
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DetailLayout } from '@/components/layout/detail-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

interface Agent {
  id: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  float_balance: string | null;
  commission_rate: string | null;
  status: string;
  location_lat: string | null;
  location_lng: string | null;
  created_at: string;
}

interface TxRow {
  id: string;
  type: string;
  amount: string;
  fee: string | null;
  timestamp: string;
}

interface ParcelRow {
  id: string;
  tracking_code: string;
  recipient_name: string;
  status: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { addToast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [parcels, setParcels] = useState<ParcelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'top_up' | 'adjustment'>('top_up');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/v1/agents/${id}`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/v1/agents/${id}/transactions?limit=20`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/v1/agent/parcels?agent_id=${id}&limit=20`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([agentRes, txRes, parcelRes]) => {
        if (cancelled) return;
        if (agentRes.id) setAgent(agentRes);
        else if (agentRes.error) addToast(agentRes.error, 'error');
        if (txRes.data) setTransactions(txRes.data);
        if (parcelRes.data) setParcels(parcelRes.data);
      })
      .catch(() => {
        if (!cancelled) addToast('Failed to load agent', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleAdjustFloat = async () => {
    const amount = Number(adjustAmount);
    if (Number.isNaN(amount) || amount === 0) {
      addToast('Enter a non-zero amount', 'error');
      return;
    }
    setAdjustSubmitting(true);
    try {
      const res = await fetch(`/api/v1/agents/${id}/float`, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type: adjustType }),
      });
      const json = await res.json();
      if (res.ok) {
        addToast('Float updated.', 'success');
        setAdjustModalOpen(false);
        setAdjustAmount('');
        if (agent) setAgent({ ...agent, float_balance: json.float_balance ?? agent.float_balance });
      } else {
        addToast(json.error ?? 'Update failed', 'error');
      }
    } catch {
      addToast('Update failed', 'error');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }
  if (!agent) {
    return (
      <div className="p-6">
        <p className="text-content-muted">Agent not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/ketchup/agents')}>
          Back to agents
        </Button>
      </div>
    );
  }

  const location = [agent.location_lat, agent.location_lng].filter(Boolean).join(', ') || '—';
  const breadcrumbs = [{ label: 'Agents', href: '/ketchup/agents' }, { label: agent.name }];

  const txCols = [
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount' },
    { key: 'fee', header: 'Fee' },
    { key: 'timestamp', header: 'Date' },
  ];
  const parcelCols = [
    { key: 'tracking_code', header: 'Tracking' },
    { key: 'recipient_name', header: 'Recipient' },
    { key: 'status', header: 'Status' },
  ];

  const txRows = transactions.map((t) => ({
    ...t,
    amount: t.amount ? `NAD ${t.amount}` : '—',
    fee: t.fee != null ? `NAD ${t.fee}` : '—',
    timestamp: t.timestamp ? new Date(t.timestamp).toLocaleString() : '—',
  }));

  const tabs = [
    {
      value: 'profile',
      label: 'Profile',
      content: (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Agent details</CardTitle>
            <Button size="sm" onClick={() => setAdjustModalOpen(true)}>
              Adjust float
            </Button>
          </CardHeader>
          <CardContent>
            <DescriptionList
              items={[
                { term: 'Name', description: agent.name },
                { term: 'Address', description: agent.address ?? '—' },
                { term: 'Contact', description: agent.contact_phone ?? agent.contact_email ?? '—' },
                { term: 'Float balance', description: agent.float_balance != null ? `NAD ${agent.float_balance}` : '—' },
                { term: 'Commission rate', description: agent.commission_rate ?? '—' },
                { term: 'Status', description: agent.status },
                { term: 'Location', description: location },
              ]}
              layout="stack"
            />
          </CardContent>
        </Card>
      ),
    },
    {
      value: 'transactions',
      label: 'Transactions',
      content: (
        <Card>
          <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={txCols}
              data={txRows}
              keyExtractor={(r) => r.id}
              emptyMessage="No transactions."
            />
          </CardContent>
        </Card>
      ),
    },
    {
      value: 'parcels',
      label: 'Parcel inventory',
      content: (
        <Card>
          <CardHeader><CardTitle>Parcels awaiting collection</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={parcelCols}
              data={parcels}
              keyExtractor={(r) => r.id}
              emptyMessage="No parcels."
            />
          </CardContent>
        </Card>
      ),
    },
    {
      value: 'terminal',
      label: 'Terminal',
      content: (
        <Card>
          <CardHeader><CardTitle>Terminal info</CardTitle></CardHeader>
          <CardContent>
            <p className="text-content-muted">Assign terminal from Terminal Inventory.</p>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <>
      <DetailLayout
        breadcrumbs={breadcrumbs}
        title={agent.name}
        subtitle={location}
        tabs={tabs}
        defaultTab="profile"
      />
      <Modal open={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title="Adjust float">
        <div className="space-y-4">
          <p className="text-sm text-content-muted">Add or subtract from agent float. Positive = top-up, negative = deduction.</p>
          <div className="form-control">
            <label className="label"><span className="label-text">Amount (NAD)</span></label>
            <input
              type="number"
              step="any"
              className="input input-bordered w-full"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 5000 or -500"
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Type</span></label>
            <select
              className="select select-bordered w-full"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as 'top_up' | 'adjustment')}
            >
              <option value="top_up">Top-up</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setAdjustModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjustFloat} loading={adjustSubmitting} disabled={adjustSubmitting}>
              Update float
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
