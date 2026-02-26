'use client';

/**
 * RoutePlanner – Field Ops plan/view routes for field techs. PRD §6.x.
 * Location: src/components/field-ops/route-planner.tsx
 * Uses: SectionHeader, Card, Button, DataTable.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

export interface RouteStop {
  id: string;
  order: number;
  assetName: string;
  address?: string;
  status: string;
}

export interface RoutePlannerProps {
  stops?: RouteStop[];
  loading?: boolean;
  onOptimize?: () => void;
  onExport?: () => void;
  className?: string;
}

export function RoutePlanner({
  stops = [],
  loading = false,
  onOptimize,
  onExport,
  className = '',
}: RoutePlannerProps) {
  const cols = [
    { key: 'order', header: '#' },
    { key: 'assetName', header: 'Asset' },
    { key: 'address', header: 'Address' },
    { key: 'status', header: 'Status' },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Route planner" description="Plan and view routes for field techs." />
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s route</CardTitle>
          <div className="flex gap-2">
            {onOptimize && <Button size="sm" variant="outline" onClick={onOptimize}>Optimize order</Button>}
            {onExport && <Button size="sm" variant="outline" onClick={onExport}>Export</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={cols}
            data={stops}
            keyExtractor={(r) => r.id}
            emptyMessage={loading ? 'Loading…' : 'No stops planned.'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
