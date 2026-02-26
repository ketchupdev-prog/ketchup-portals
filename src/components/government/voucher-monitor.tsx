'use client';

/**
 * VoucherMonitor – Government voucher issuance/redemption monitoring by programme. PRD §4.x.
 * Location: src/components/government/voucher-monitor.tsx
 * Uses: SectionHeader, DataTable, Select, Card.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface VoucherMonitorRow {
  id: string;
  programme: string;
  issued: number;
  redeemed: number;
  expired: number;
  status: string;
}

export interface VoucherMonitorProps {
  data: VoucherMonitorRow[];
  loading?: boolean;
  programmeFilter?: string;
  onProgrammeFilterChange?: (value: string) => void;
  className?: string;
}

const COLS = [
  { key: 'programme', header: 'Programme' },
  { key: 'issued', header: 'Issued' },
  { key: 'redeemed', header: 'Redeemed' },
  { key: 'expired', header: 'Expired' },
  { key: 'status', header: 'Status' },
];

export function VoucherMonitor({
  data,
  loading = false,
  programmeFilter = '',
  onProgrammeFilterChange,
  className = '',
}: VoucherMonitorProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Voucher monitor" description="Issuance and redemption by programme." />
      {onProgrammeFilterChange && (
        <Select
          options={[{ value: '', label: 'All programmes' }, { value: 'p1', label: 'Programme 1' }, { value: 'p2', label: 'Programme 2' }]}
          value={programmeFilter}
          onChange={(e) => onProgrammeFilterChange(e.target.value)}
          inputSize="sm"
          className="w-44"
        />
      )}
      <Card>
        <CardHeader><CardTitle>Voucher summary</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={COLS}
            data={data}
            keyExtractor={(r) => r.id}
            emptyMessage={loading ? 'Loading…' : 'No data.'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
