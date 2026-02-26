'use client';

/**
 * Mobile Units & ATMs – Ketchup Portal (PRD §3.2.5).
 * List and map from GET /api/v1/assets; Add unit/ATM via POST /api/v1/assets.
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { MobileUnitsList } from '@/components/ketchup/mobile-units-list';
import { MobileUnitsMap } from '@/components/ketchup/mobile-units-map';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

interface AssetRow {
  id: string;
  type: string;
  name: string;
  status: string;
  driver?: string | null;
  cash_level?: string | null;
  last_replenishment?: string | null;
  created_at?: string;
}

export default function MobileUnitsPage() {
  const { addToast } = useToast();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [units, setUnits] = useState<AssetRow[]>([]);
  const [atms, setAtms] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'mobile_unit' | 'atm'>('mobile_unit');
  const [addName, setAddName] = useState('');
  const [addDriver, setAddDriver] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/v1/assets?type=mobile_unit&limit=100', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/v1/assets?type=atm&limit=100', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([uRes, aRes]) => {
        setUnits(uRes.data ?? []);
        setAtms(aRes.data ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAdd = async () => {
    const name = addName.trim();
    if (!name) {
      addToast('Name is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/assets', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: addType,
          name,
          driver: addType === 'mobile_unit' && addDriver.trim() ? addDriver.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        addToast(`${addType === 'mobile_unit' ? 'Unit' : 'ATM'} added.`, 'success');
        setAddModalOpen(false);
        setAddName('');
        setAddDriver('');
        fetchAssets();
      } else {
        addToast(json.error ?? 'Failed to add', 'error');
      }
    } catch {
      addToast('Failed to add', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const unitRows = units.map((u) => ({
    id: u.id,
    type: 'mobile' as const,
    driver: u.driver ?? '—',
    location: u.name,
    lastActivity: '—',
    nextMaintenance: '—',
    status: u.status,
  }));
  const atmRows = atms.map((a) => ({
    id: a.id,
    type: 'atm' as const,
    location: a.name,
    cashLevel: a.cash_level ?? '—',
    status: a.status,
    lastReplenishment: a.last_replenishment ? new Date(a.last_replenishment).toLocaleDateString() : '—',
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mobile Units & ATMs"
        description="List and map of mobile units and ATMs. Add new units or ATMs below."
        action={
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            Add unit / ATM
          </Button>
        }
      />
      {view === 'list' ? (
        <MobileUnitsList
          units={unitRows}
          atms={atmRows}
          loading={loading}
          onViewMap={() => setView('map')}
        />
      ) : (
        <MobileUnitsMap onViewList={() => setView('list')} />
      )}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add unit or ATM">
        <div className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Type</span></label>
            <select
              className="select select-bordered w-full"
              value={addType}
              onChange={(e) => setAddType(e.target.value as 'mobile_unit' | 'atm')}
            >
              <option value="mobile_unit">Mobile unit</option>
              <option value="atm">ATM</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Name</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Windhoek Unit 1"
            />
          </div>
          {addType === 'mobile_unit' && (
            <div className="form-control">
              <label className="label"><span className="label-text">Driver (optional)</span></label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={addDriver}
                onChange={(e) => setAddDriver(e.target.value)}
                placeholder="Driver name"
              />
            </div>
          )}
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} loading={submitting} disabled={submitting}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
