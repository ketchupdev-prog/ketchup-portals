'use client';

/**
 * Field Ops Unit/ATM Management – PRD §6.2.2.
 * Data from GET /api/v1/field/assets; filter by type; detail link.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SectionHeader } from '@/components/ui/section-header';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';

type AssetRow = { id: string; type: string; name: string; driver: string; location: string; lastActivity: string; lastMaintenance: string; cashLevel: string; status: string };

export default function FieldOpsAssetsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('units');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AssetRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (typeFilter) params.set('type', typeFilter);
    fetch(`/api/v1/field/assets?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setData(json.data.map((r: { id: string; type: string; name: string; driver: string | null; location_lat: string | null; location_lng: string | null; status: string; cash_level: string | null; last_replenishment: string | null; created_at: string }) => ({
            id: r.id,
            type: r.type ?? '—',
            name: r.name ?? '—',
            driver: r.driver ?? '—',
            location: [r.location_lat, r.location_lng].filter(Boolean).join(', ') || '—',
            lastActivity: r.created_at?.slice(0, 16) ?? '—',
            lastMaintenance: r.last_replenishment ? r.last_replenishment.slice(0, 10) : '—',
            cashLevel: r.cash_level ? `${r.cash_level}%` : '—',
            status: r.status ?? '—',
          })));
        } else setData([]);
      })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [typeFilter]);

  const units = useMemo(() => data.filter((r) => r.type !== 'atm'), [data]);
  const atms = useMemo(() => data.filter((r) => r.type === 'atm'), [data]);

  const tabs = [
    {
      key: 'units',
      label: 'Mobile units',
      content: (
        <DataTable
          columns={[{ key: 'name', header: 'Name' }, { key: 'driver', header: 'Driver' }, { key: 'location', header: 'Location' }, { key: 'lastActivity', header: 'Last activity' }, { key: 'status', header: 'Status' }]}
          data={units}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`/field-ops/assets/${r.id}`)}
          emptyMessage={loading ? 'Loading…' : 'No mobile units.'}
        />
      ),
    },
    {
      key: 'atms',
      label: 'ATMs',
      content: (
        <DataTable
          columns={[{ key: 'name', header: 'Location' }, { key: 'cashLevel', header: 'Cash level' }, { key: 'status', header: 'Status' }, { key: 'lastMaintenance', header: 'Last maintenance' }]}
          data={atms}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`/field-ops/assets/${r.id}`)}
          emptyMessage={loading ? 'Loading…' : 'No ATMs.'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Assets" description="Mobile units and ATMs; maintenance and replenishment." />
      <Select options={[{ value: '', label: 'All types' }, { value: 'mobile', label: 'Mobile' }, { value: 'atm', label: 'ATM' }]} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} inputSize="sm" className="w-36" />
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="bordered" />
    </div>
  );
}
