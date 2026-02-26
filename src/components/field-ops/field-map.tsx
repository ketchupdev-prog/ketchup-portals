'use client';

/**
 * FieldMap – Interactive map with live tracking of units, ATMs. Field Ops Portal.
 * Location: src/components/field-ops/field-map.tsx
 */

import dynamic from 'next/dynamic';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';

const Map = dynamic(() => import('@/components/maps/map').then((m) => m.Map), { ssr: false });
const AssetMarker = dynamic(() => import('@/components/maps/asset-marker').then((m) => m.AssetMarker), { ssr: false });

export interface FieldMapMarker {
  id: string;
  position: [number, number];
  label: string;
  type: 'unit' | 'atm' | 'agent';
  status?: string;
}

export interface FieldMapProps {
  center?: [number, number];
  markers?: FieldMapMarker[];
  height?: number;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [-22.56, 17.08];

export function FieldMap({
  center = DEFAULT_CENTER,
  markers = [],
  height = 500,
  className = '',
}: FieldMapProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <SectionHeader title="Map" description="Mobile units and fixed locations." />
      <div className="rounded-lg overflow-hidden border border-base-300" style={{ height }}>
        <Map center={center} zoom={8} height={height}>
          {markers.map((m) => (
            <AssetMarker
              key={m.id}
              position={m.position}
              label={m.label}
              type={m.type}
              popup={m.status != null ? <span>{m.label} – {m.status}</span> : <span>{m.label}</span>}
            />
          ))}
        </Map>
      </div>
    </div>
  );
}
