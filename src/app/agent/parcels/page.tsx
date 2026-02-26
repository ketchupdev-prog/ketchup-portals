'use client';

/**
 * Agent Parcel Management – PRD §5.2.4.
 * Uses ParcelList and ParcelScan; data from GET /api/v1/agent/parcels; mark collected via POST /api/v1/agent/parcels/[id]/collect.
 */

import { useState, useEffect, useCallback } from 'react';
import { ParcelList, ParcelScan, type ParcelRow } from '@/components/agent';
import { useToast } from '@/components/ui/toast';

export default function AgentParcelsPage() {
  const { addToast } = useToast();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<ParcelRow[]>([]);

  const loadParcels = useCallback(() => {
    if (!agentId) return;
    setLoading(true);
    fetch(`/api/v1/agent/parcels?agent_id=${agentId}&page=1&limit=100`, { credentials: 'include' })
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
  }, [agentId]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/agents?limit=1', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const id = json.data?.[0]?.id ?? null;
        setAgentId(id);
        if (!id) return;
        setLoading(true);
        return fetch(`/api/v1/agent/parcels?agent_id=${id}&page=1&limit=100`, { credentials: 'include' }).then((r) => r.json());
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

  const handleMarkCollected = async (trackingCode: string) => {
    if (!agentId) { addToast('No agent loaded.', 'error'); return; }
    const parcel = parcels.find((p) => p.trackingCode === trackingCode || p.id === trackingCode);
    if (!parcel) { addToast('Parcel not found for this code.', 'error'); return; }
    try {
      const res = await fetch(`/api/v1/agent/parcels/${parcel.id}/collect`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      });
      const json = await res.json();
      if (!res.ok) { addToast(json.error ?? 'Failed to mark collected.', 'error'); return; }
      setScanModalOpen(false);
      addToast('Parcel marked as collected.', 'success');
      loadParcels();
    } catch { addToast('Failed to mark collected.', 'error'); }
  };

  return (
    <>
      <ParcelList
        incoming={incoming}
        history={history}
        loading={loading}
        onScanClick={() => setScanModalOpen(true)}
      />
      <ParcelScan
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onMarkCollected={handleMarkCollected}
      />
    </>
  );
}
