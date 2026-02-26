'use client';

/**
 * AssetDetail – Field Ops detail view for one asset (unit/ATM). PRD §6.2.2.
 * Location: src/components/field-ops/asset-detail.tsx
 * Uses: Card, DescriptionList, Button, SectionHeader.
 */

import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import { Button } from '@/components/ui/button';

export interface AssetDetailProps {
  id: string;
  name: string;
  type: string;
  status?: string;
  driver?: string;
  location?: string;
  cashLevel?: string;
  lastMaintenance?: string;
  lastActivity?: string;
  onLogMaintenance?: () => void;
  tasksLink?: string;
  className?: string;
}

export function AssetDetail({
  id,
  name,
  type,
  status = '—',
  driver = '—',
  location = '—',
  cashLevel,
  lastMaintenance = '—',
  lastActivity = '—',
  onLogMaintenance,
  tasksLink,
  className = '',
}: AssetDetailProps) {
  const items = [
    { term: 'ID', description: id },
    { term: 'Name', description: name },
    { term: 'Type', description: type },
    { term: 'Status', description: status },
    { term: 'Driver', description: driver },
    { term: 'Location', description: location },
    ...(cashLevel != null ? [{ term: 'Cash level', description: cashLevel }] : []),
    { term: 'Last maintenance', description: lastMaintenance },
    { term: 'Last activity', description: lastActivity },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title={name} description={`${type} · ${status}`} />
      <Card>
        <CardHeader><CardTitle>Asset details</CardTitle></CardHeader>
        <CardContent>
          <DescriptionList items={items} layout="stack" />
          <div className="flex flex-wrap gap-2 mt-4">
            {onLogMaintenance && <Button size="sm" onClick={onLogMaintenance}>Log maintenance</Button>}
            {tasksLink && <Link href={tasksLink}><Button size="sm" variant="outline">View tasks</Button></Link>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
