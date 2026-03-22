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

export type MapMarker = {
  id: string;
  position: [number, number];
  label: string;
  type: 'unit' | 'atm';
  status: string;
};

export interface MobileUnitsMapProps {
  height?: number;
  onViewList?: () => void;
  markers?: MapMarker[];
}

export function MobileUnitsMap({ height = 500, onViewList, markers = [] }: MobileUnitsMapProps) {
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
          {markers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-content-muted">No mobile units or ATMs to display. Data will be loaded from API.</p>
            </div>
          ) : (
            markers.map((m) => (
              <AssetMarker
                key={m.id}
                position={m.position}
                label={m.label}
                type={m.type}
                popup={<span>{m.label} – {m.status}</span>}
              />
            ))
          )}
        </Map>
      </div>
    </div>
  );
}
