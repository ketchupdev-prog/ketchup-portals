'use client';

/**
 * ActivityReport – Field Ops activity/field report view or form. PRD §6.x.
 * Location: src/components/field-ops/activity-report.tsx
 * Uses: SectionHeader, Card, DataTable, Button.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

export interface ActivityReportRow {
  id: string;
  date: string;
  tech: string;
  asset: string;
  activity: string;
  duration?: string;
}

export interface ActivityReportProps {
  data?: ActivityReportRow[];
  loading?: boolean;
  onExport?: () => void;
  className?: string;
}

const COLS = [
  { key: 'date', header: 'Date' },
  { key: 'tech', header: 'Technician' },
  { key: 'asset', header: 'Asset' },
  { key: 'activity', header: 'Activity' },
  { key: 'duration', header: 'Duration' },
];

export function ActivityReport({ data = [], loading = false, onExport, className = '' }: ActivityReportProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Activity report" description="Field activity and task completion." />
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          {onExport && <Button size="sm" variant="outline" onClick={onExport}>Export</Button>}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={COLS}
            data={data}
            keyExtractor={(r) => r.id}
            emptyMessage={loading ? 'Loading…' : 'No activity recorded.'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
