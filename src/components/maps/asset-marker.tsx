'use client';

import dynamic from 'next/dynamic';

const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

export interface AssetMarkerProps {
  position: [number, number];
  label?: string;
  type?: 'unit' | 'atm' | 'agent';
  popup?: React.ReactNode;
}

export function AssetMarker({ position, label, type = 'unit', popup }: AssetMarkerProps) {
  const L = typeof window !== 'undefined' ? require('leaflet') : null;
  const icon = L
    ? L.divIcon({
        className: 'asset-marker',
        html: `<div class="w-6 h-6 rounded-full bg-primary border-2 border-white shadow">${label?.slice(0, 1) ?? '?'}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
    : undefined;
  return (
    <Marker position={position} icon={icon}>
      {popup != null && <Popup>{popup}</Popup>}
    </Marker>
  );
}
