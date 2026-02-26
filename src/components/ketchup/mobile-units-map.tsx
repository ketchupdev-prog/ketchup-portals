'use client';

/**
 * MobileUnitsMap – Map view of mobile units and ATMs (PRD §3.2.5).
 * Location: src/components/ketchup/mobile-units-map.tsx
 */

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

const Map = dynamic(() => import('@/components/maps/map').then((m) => m.Map), { ssr: false });
const AssetMarker = dynamic(() => import('@/components/maps/asset-marker').then((m) => m.AssetMarker), { ssr: false });

const DEFAULT_CENTER: [number, number] = [-22.56, 17.08];

const SAMPLE_MARKERS = [
  { id: 'u1', position: [-22.56, 17.08] as [number, number], label: 'Unit 1 – Andreas N.', type: 'unit' as const, status: 'Active' },
  { id: 'u2', position: [-22.95, 14.51] as [number, number], label: 'Unit 2 – Maria K.', type: 'unit' as const, status: 'Active' },
  { id: 'a1', position: [-22.57, 17.09] as [number, number], label: 'ATM Windhoek Central', type: 'atm' as const, status: 'Online' },
  { id: 'a2', position: [-22.68, 14.52] as [number, number], label: 'ATM Swakopmund', type: 'atm' as const, status: 'Online' },
];

export interface MobileUnitsMapProps {
  height?: number;
  onViewList?: () => void;
}

export function MobileUnitsMap({ height = 500, onViewList }: MobileUnitsMapProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Map view</h2>
        {onViewList && (
          <Button variant="outline" size="sm" onClick={onViewList}>
            View list
          </Button>
        )}
      </div>
      <div className="rounded-lg overflow-hidden border border-base-300" style={{ height }}>
        <Map center={DEFAULT_CENTER} zoom={7} height={height}>
          {SAMPLE_MARKERS.map((m) => (
            <AssetMarker
              key={m.id}
              position={m.position}
              label={m.label}
              type={m.type}
              popup={<span>{m.label} – {m.status}</span>}
            />
          ))}
        </Map>
      </div>
    </div>
  );
}
