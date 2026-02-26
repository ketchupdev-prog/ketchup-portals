'use client';

/**
 * NetworkMap – Ketchup integrated network map (agents, ATMs, units). PRD §3.2.8.
 * Location: src/components/ketchup/network-map.tsx
 * Uses: SectionHeader, Map, AssetMarker, Select, Button.
 */

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SectionHeader } from '@/components/ui/section-header';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { REGION_SELECT_OPTIONS } from '@/lib/regions';

const Map = dynamic(() => import('@/components/maps/map').then((m) => m.Map), { ssr: false });
const AssetMarker = dynamic(() => import('@/components/maps/asset-marker').then((m) => m.AssetMarker), { ssr: false });

const DEFAULT_CENTER: [number, number] = [-22.56, 17.08];

export interface NetworkMapMarker {
  id: string;
  position: [number, number];
  label: string;
  type: 'agent' | 'atm' | 'unit';
  status?: string;
}

export interface NetworkMapProps {
  markers?: NetworkMapMarker[];
  typeFilter?: string;
  regionFilter?: string;
  showCoverage?: boolean;
  onTypeFilterChange?: (value: string) => void;
  onRegionFilterChange?: (value: string) => void;
  onToggleCoverage?: () => void;
  height?: number;
  className?: string;
}

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'agent', label: 'Agents' },
  { value: 'atm', label: 'ATMs' },
  { value: 'unit', label: 'Mobile units' },
];

export function NetworkMap({
  markers = [],
  typeFilter = '',
  regionFilter = '',
  showCoverage = false,
  onTypeFilterChange,
  onRegionFilterChange,
  onToggleCoverage,
  height = 560,
  className = '',
}: NetworkMapProps) {
  const filteredMarkers = useMemo(() => {
    if (!typeFilter) return markers;
    return markers.filter((m) => m.type === typeFilter);
  }, [markers, typeFilter]);

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader
        title="Integrated Network Map"
        description="Agents, NamPost, ATMs, mobile units. Filter by type, region, status; optional coverage circles."
      />
      <div className="flex flex-wrap gap-3 items-center">
        <Select options={TYPE_OPTIONS} value={typeFilter} onChange={(e) => onTypeFilterChange?.(e.target.value)} inputSize="sm" className="w-40" />
        <Select options={REGION_SELECT_OPTIONS} value={regionFilter} onChange={(e) => onRegionFilterChange?.(e.target.value)} inputSize="sm" className="w-40" />
        {onToggleCoverage && (
          <Button variant={showCoverage ? 'primary' : 'outline'} size="sm" onClick={onToggleCoverage}>
            {showCoverage ? 'Hide' : 'Show'} coverage circles
          </Button>
        )}
      </div>
      <div className="rounded-lg overflow-hidden border border-base-300" style={{ height }}>
        <Map center={DEFAULT_CENTER} zoom={7} height={height}>
          {filteredMarkers.map((m) => (
            <AssetMarker
              key={m.id}
              position={m.position}
              label={m.label}
              type={m.type}
              popup={<span>{m.label} – {m.status ?? '—'}</span>}
            />
          ))}
        </Map>
      </div>
    </div>
  );
}
