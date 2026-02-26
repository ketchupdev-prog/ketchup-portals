'use client';

/**
 * Agent Parcel Management – PRD §5.2.4.
 * Data from GET /api/v1/agent/parcels; mark collected via POST /api/v1/agent/parcels/[id]/collect.
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

type ParcelRow = { id: string; trackingCode: string; recipientName: string; status: string; date?: string };

export default function AgentParcelsPage() {
  const { addToast } = useToast();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('incoming');
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<ParcelRow[]>([]);

  const loadParcels = () => {
    if (!agentId) return;
    setLoading(true);
    fetch(`/api/v1/agent/parcels?agent_id=${agentId}&page=1&limit=100`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          setParcels(json.data.map((r: { id: string; tracking_code: string; recipient_name: string; status: string; created_at: string; collected_at: string | null }) => ({
            id: r.id,
            trackingCode: r.tracking_code ?? '—',
            recipientName: r.recipient_name ?? '—',
            status: r.status === 'ready' ? 'Ready for collection' : r.status === 'collected' ? 'Collected' : r.status,
            date: r.collected_at ? r.collected_at.slice(0, 10) : r.created_at.slice(0, 10),
          })));
        } else setParcels([]);
      })
      .catch(() => setParcels([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/agents?limit=1')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const id = json.data?.[0]?.id ?? null;
        setAgentId(id);
        if (!id) return;
        setLoading(true);
        return fetch(`/api/v1/agent/parcels?agent_id=${id}&page=1&limit=100`).then((r) => r.json());
      })
      .then((json) => {
        if (cancelled || !json) return;
        if (json.data && Array.isArray(json.data)) {
          setParcels(json.data.map((r: { id: string; tracking_code: string; recipient_name: string; status: string; created_at: string; collected_at: string | null }) => ({
            id: r.id,
            trackingCode: r.tracking_code ?? '—',
            recipientName: r.recipient_name ?? '—',
            status: r.status === 'ready' ? 'Ready for collection' : r.status === 'collected' ? 'Collected' : r.status,
            date: r.collected_at ? r.collected_at.slice(0, 10) : r.created_at.slice(0, 10),
          })));
        } else setParcels([]);
      })
      .catch(() => setParcels([]))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const incoming = parcels.filter((p) => p.status === 'Ready for collection');
  const history = parcels.filter((p) => p.status === 'Collected');

  const handleMarkCollected = async () => {
    const code = scanCode.trim();
    if (!code) { addToast('Enter tracking code.', 'error'); return; }
    if (!agentId) { addToast('No agent loaded.', 'error'); return; }
    const parcel = parcels.find((p) => p.trackingCode === code || p.id === code);
    if (!parcel) { addToast('Parcel not found for this code.', 'error'); return; }
    try {
      const res = await fetch(`/api/v1/agent/parcels/${parcel.id}/collect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_id: agentId }) });
      const json = await res.json();
      if (!res.ok) { addToast(json.error ?? 'Failed to mark collected.', 'error'); return; }
      setScanModalOpen(false);
      setScanCode('');
      addToast('Parcel marked as collected.', 'success');
      loadParcels();
    } catch { addToast('Failed to mark collected.', 'error'); }
  };

  const tabs = [
    {
      key: 'incoming',
      label: 'Incoming (ready for collection)',
      content: (
        <div className="space-y-4">
          <Button size="sm" onClick={() => setScanModalOpen(true)}>Scan / Mark collected</Button>
          <DataTable
            columns={[{ key: 'trackingCode', header: 'Tracking' }, { key: 'recipientName', header: 'Recipient' }, { key: 'status', header: 'Status' }]}
            data={incoming}
            keyExtractor={(r) => r.id}
            emptyMessage={loading ? 'Loading…' : 'No parcels ready for collection.'}
          />
        </div>
      ),
    },
    {
      key: 'history',
      label: 'History',
      content: (
        <DataTable
          columns={[{ key: 'trackingCode', header: 'Tracking' }, { key: 'recipientName', header: 'Recipient' }, { key: 'status', header: 'Status' }, { key: 'date', header: 'Date' }]}
          data={history}
          keyExtractor={(r) => r.id}
          emptyMessage={loading ? 'Loading…' : 'No parcel history.'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Parcel management" description="Incoming parcels, scan to mark collected, history." />
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="bordered" />
      <Modal open={scanModalOpen} onClose={() => setScanModalOpen(false)} title="Scan parcel / Mark collected">
        <div className="space-y-4">
          <Input label="Tracking code" value={scanCode} onChange={(e) => setScanCode(e.target.value)} placeholder="Enter or scan code" />
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setScanModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkCollected}>Mark collected</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
