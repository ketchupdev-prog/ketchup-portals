'use client';

/**
 * Field Ops Route Planning – PRD §6.2.5.
 * Uses RoutePlanner; data from GET /api/v1/field/route (stops). POST for optimize when backend supports it.
 */

import { useState, useEffect } from 'react';
import { RoutePlanner, type RouteStop } from '@/components/field-ops';

function mapApiStop(s: { id: string; order?: number; asset_name?: string; asset_id?: string; address?: string; status?: string }, index: number): RouteStop {
  return {
    id: s.id,
    order: s.order ?? index + 1,
    assetName: s.asset_name ?? s.asset_id ?? s.id,
    address: s.address,
    status: s.status ?? 'pending',
  };
}

export default function FieldOpsRoutesPage() {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoute = () => {
    setLoading(true);
    fetch('/api/v1/field/route', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        const raw = json.stops ?? [];
        setStops(Array.isArray(raw) ? raw.map(mapApiStop) : []);
      })
      .catch(() => setStops([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoute();
  }, []);

  const handleOptimize = () => {
    loadRoute();
  };

  const handleExport = () => {
    const header = 'order,asset,address,status';
    const body = stops.map((s) => [s.order, s.assetName, s.address ?? '', s.status].join(',')).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RoutePlanner
      stops={stops}
      loading={loading}
      onOptimize={handleOptimize}
      onExport={handleExport}
    />
  );
}
