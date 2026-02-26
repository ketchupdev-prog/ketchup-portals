'use client';

/**
 * CoverageCircle – Radius circle around a point (e.g. agent coverage area). COMPONENT_INVENTORY §8.
 * Location: src/components/maps/coverage-circle.tsx
 */

import dynamic from 'next/dynamic';

const Circle = dynamic(() => import('react-leaflet').then((m) => m.Circle), { ssr: false });

export interface CoverageCircleProps {
  center: [number, number];
  /** Radius in metres */
  radius: number;
  /** CSS color or Leaflet path option (default primary with opacity) */
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  weight?: number;
}

export function CoverageCircle({
  center,
  radius,
  color = '#3b82f6',
  fillColor,
  fillOpacity = 0.15,
  weight = 2,
}: CoverageCircleProps) {
  return (
    <Circle
      center={center}
      radius={radius}
      pathOptions={{
        color,
        fillColor: fillColor ?? color,
        fillOpacity,
        weight,
      }}
    />
  );
}
