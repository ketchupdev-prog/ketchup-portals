'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });

export interface MapProps {
  center: [number, number];
  zoom?: number;
  height?: number;
  className?: string;
  children?: React.ReactNode;
}

export function Map({ center, zoom = 10, height = 400, className = '', children }: MapProps) {
  return (
    <div className={cn('rounded-lg overflow-hidden border border-base-300', className)} style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {children}
      </MapContainer>
    </div>
  );
}
