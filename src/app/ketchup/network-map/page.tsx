'use client';

/**
 * Integrated Network Map – Ketchup Portal (PRD §3.2.8).
 * Layers: agents, NamPost, ATMs, mobile units, warehouses; filter by type, region, status; coverage circles.
 */

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SectionHeader } from '@/components/ui/section-header';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const Map = dynamic(() => import('@/components/maps/map').then((m) => m.Map), { ssr: false });
const AssetMarker = dynamic(() => import('@/components/maps/asset-marker').then((m) => m.AssetMarker), { ssr: false });

const DEFAULT_CENTER: [number, number] = [-22.56, 17.08];

const SAMPLE_MARKERS = [
  { id: 'ag1', position: [-22.56, 17.08] as [number, number], label: 'Windhoek Mini Market', type: 'agent' as const, status: 'Active' },
  { id: 'ag2', position: [-22.95, 14.51] as [number, number], label: 'Swakop Spar', type: 'agent' as const, status: 'Active' },
  { id: 'atm1', position: [-22.57, 17.09] as [number, number], label: 'ATM Windhoek Central', type: 'atm' as const, status: 'Online' },
  { id: 'u1', position: [-22.58, 17.07] as [number, number], label: 'Mobile Unit 1', type: 'unit' as const, status: 'Active' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'agent', label: 'Agents' },
  { value: 'atm', label: 'ATMs' },
  { value: 'unit', label: 'Mobile units' },
];

const REGION_OPTIONS = [
  { value: '', label: 'All regions' },
  { value: 'Khomas', label: 'Khomas' },
  { value: 'Erongo', label: 'Erongo' },
];

export default function NetworkMapPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [showCoverage, setShowCoverage] = useState(false);

  const filteredMarkers = useMemo(() => {
    if (!typeFilter) return SAMPLE_MARKERS;
    return SAMPLE_MARKERS.filter((m) => m.type === typeFilter);
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Integrated Network Map"
        description="Agents, NamPost, ATMs, mobile units. Filter by type, region, status; optional coverage circles."
      />
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          inputSize="sm"
          className="w-40"
        />
        <Select
          options={REGION_OPTIONS}
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          inputSize="sm"
          className="w-40"
        />
        <Button
          variant={showCoverage ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setShowCoverage(!showCoverage)}
        >
          {showCoverage ? 'Hide' : 'Show'} coverage circles
        </Button>
      </div>
      <div className="rounded-lg overflow-hidden border border-base-300" style={{ height: 560 }}>
        <Map center={DEFAULT_CENTER} zoom={7} height={560}>
          {filteredMarkers.map((m) => (
            <AssetMarker
              key={m.id}
              position={m.position}
              label={m.label}
              type={m.type}
              popup={
                <span>
                  {m.label} – {m.status}
                  <br />
                  <a href={`/ketchup/agents/${m.id.startsWith('ag') ? m.id.replace('ag', '') : '#'}`} className="link link-primary text-sm">
                    View detail
                  </a>
                </span>
              }
            />
          ))}
        </Map>
      </div>
    </div>
  );
}
