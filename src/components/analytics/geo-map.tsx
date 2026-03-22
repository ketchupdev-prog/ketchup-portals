'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
  value: number;
}

interface GeoMapProps {
  data: GeoPoint[];
  center?: LatLngExpression;
  zoom?: number;
  height?: string;
  title?: string;
}

function MapController({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export function GeoMap({ data, center = [-22.5597, 17.0832], zoom = 6, height = '400px', title }: GeoMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full" style={{ height }}>
        <div className="skeleton w-full h-full rounded-lg"></div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <div style={{ height }} className="rounded-lg overflow-hidden">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <MapController center={center} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data.map((point, index) => {
            const radius = 5 + (point.value / maxValue) * 20;
            
            return (
              <CircleMarker
                key={index}
                center={[point.lat, point.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: '#3b82f6',
                  color: '#1e40af',
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.6,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{point.label}</div>
                    <div className="text-content-muted">{point.value.toLocaleString()}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
