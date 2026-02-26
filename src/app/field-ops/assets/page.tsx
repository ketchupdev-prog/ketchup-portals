'use client';

/**
 * Field Ops Unit/ATM Management – PRD §6.2.2.
 * Data from GET /api/v1/field/assets; uses AssetList component.
 */

import { useState, useEffect, useMemo } from 'react';
import { AssetList, type AssetRow } from '@/components/field-ops';

export default function FieldOpsAssetsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AssetRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (typeFilter) params.set('type', typeFilter);
    fetch(`/api/v1/field/assets?${params.toString()}`, { credentials: 'include' })
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

  return (
    <AssetList
      units={units}
      atms={atms}
      loading={loading}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
    />
  );
}
