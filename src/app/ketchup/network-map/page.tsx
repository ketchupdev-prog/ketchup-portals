'use client';

/**
 * Integrated Network Map – Ketchup Portal (PRD §3.2.8).
 * Uses NetworkMap; markers from GET /api/v1/assets/map (GeoJSON features → agents, ATMs, units).
 */

import { useState, useEffect } from 'react';
import { NetworkMap, type NetworkMapMarker } from '@/components/ketchup';

function mapFeatureToMarker(f: { type: string; geometry: { coordinates: [number, number] }; properties: { id: string; type?: string; name?: string; status?: string; layer?: string } }): NetworkMapMarker | null {
  const coords = f.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const lat = coords[1];
  const lng = coords[0];
  const pos: [number, number] = [Number(lat), Number(lng)];
  const id = f.properties?.id ?? crypto.randomUUID();
  const label = f.properties?.name ?? id;
  const status = f.properties?.status ?? '';
  const layer = f.properties?.layer;
  let type: 'agent' | 'atm' | 'unit' = 'agent';
  if (layer === 'agent') type = 'agent';
  else if (f.properties?.type === 'atm' || (f.properties?.type && String(f.properties.type).toLowerCase().includes('atm'))) type = 'atm';
  else if (f.properties?.type === 'mobile_unit' || (f.properties?.type && String(f.properties.type).toLowerCase().includes('unit'))) type = 'unit';
  else if (layer === 'asset' && f.properties?.type) {
    const t = String(f.properties.type).toLowerCase();
    if (t.includes('atm')) type = 'atm';
    else if (t.includes('mobile') || t.includes('unit')) type = 'unit';
  }
  return { id, position: pos, label, type, status };
}

export default function NetworkMapPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [showCoverage, setShowCoverage] = useState(false);
  const [markers, setMarkers] = useState<NetworkMapMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/assets/map', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const features = json.features ?? [];
        const mapped = features
          .map(mapFeatureToMarker)
          .filter((m: NetworkMapMarker | null): m is NetworkMapMarker => m != null);
        setMarkers(mapped);
      })
      .catch(() => { if (!cancelled) setMarkers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <NetworkMap
      markers={markers}
      typeFilter={typeFilter}
      regionFilter={regionFilter}
      showCoverage={showCoverage}
      onTypeFilterChange={setTypeFilter}
      onRegionFilterChange={setRegionFilter}
      onToggleCoverage={() => setShowCoverage((v) => !v)}
      height={560}
    />
  );
}
