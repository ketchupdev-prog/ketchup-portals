'use client';

/**
 * LiveLocationMarker – Marker that shows real-time position updates (e.g. live tracking).
 * Use with polling or WebSocket updates. Renders a pulsing dot. COMPONENT_INVENTORY §8.
 * Location: src/components/maps/live-location-marker.tsx
 */

import dynamic from 'next/dynamic';

const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

export interface LiveLocationMarkerProps {
  position: [number, number];
  label?: string;
  /** Optional popup content */
  popup?: React.ReactNode;
  /** Whether to show a pulse animation (default true) */
  live?: boolean;
}

export function LiveLocationMarker({ position, label, popup, live = true }: LiveLocationMarkerProps) {
  const L = typeof window !== 'undefined' ? require('leaflet') : null;
  const icon = L
    ? L.divIcon({
        className: 'live-location-marker',
        html: `<div class="live-marker-dot ${live ? 'live-marker-pulse' : ''}">${label?.slice(0, 1) ?? '·'}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
    : undefined;
  return (
    <Marker position={position} icon={icon}>
      {(popup != null || label != null) && (
        <Popup>
          {popup ?? (label != null ? <span>{label}</span> : null)}
        </Popup>
      )}
    </Marker>
  );
}
