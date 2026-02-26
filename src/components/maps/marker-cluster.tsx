'use client';

/**
 * MarkerCluster – Wrapper for clustered markers. Renders children (Marker/AssetMarker) in a group.
 * For full clustering use leaflet.markercluster; this is a simple group wrapper.
 * Location: src/components/maps/marker-cluster.tsx
 */

import { cn } from '@/lib/utils';

export interface MarkerClusterProps {
  children: React.ReactNode;
  className?: string;
}

export function MarkerCluster({ children, className = '' }: MarkerClusterProps) {
  return <div className={cn('leaflet-marker-cluster-wrapper', className)} data-marker-cluster>{children}</div>;
}
