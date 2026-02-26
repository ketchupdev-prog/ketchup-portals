'use client';

/**
 * Field Ops Map View – PRD §6.2.1.
 * Data from GET /api/v1/field/map (GeoJSON → markers).
 */

import { useState, useEffect } from 'react';
import { FieldMap, type FieldMapMarker } from '@/components/field-ops/field-map';
import { Button } from '@/components/ui/button';

function geoJsonToMarkers(geo: { features?: Array<{ geometry: { coordinates: [number, number] }; properties: { id: string; type?: string; name?: string; status?: string; layer?: string } }> }): FieldMapMarker[] {
  const markers: FieldMapMarker[] = [];
  for (const f of geo.features ?? []) {
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties;
    const type = p.layer === 'agent' ? 'agent' : (p.type === 'atm' ? 'atm' : 'unit');
    markers.push({
      id: p.id,
      position: [lat, lng],
      label: (p.name as string) ?? p.id,
      type,
      status: p.status as string | undefined,
    });
  }
  return markers;
}

export default function FieldOpsMapPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [markers, setMarkers] = useState<FieldMapMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/field/map', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setMarkers(geoJsonToMarkers(json));
      })
      .catch(() => { if (!cancelled) setMarkers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <FieldMap markers={markers} height={520} />
      {loading && <p className="text-sm text-content-muted">Loading map…</p>}
      {selectedId && (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline">Log maintenance</Button>
          <Button size="sm" variant="outline">Replenish (ATM)</Button>
        </div>
      )}
    </div>
  );
}
