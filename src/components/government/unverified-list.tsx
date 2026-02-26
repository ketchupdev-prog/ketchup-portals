'use client';

/**
 * UnverifiedList – Government list of unverified/overdue beneficiaries. PRD §4.2.2.
 * Location: src/components/government/unverified-list.tsx
 * Uses: SectionHeader, SearchHeader, DataTable, Select, Button.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { REGION_SELECT_OPTIONS } from '@/lib/regions';

export interface UnverifiedRow {
  id: string;
  name: string;
  region: string;
  programme: string;
  daysOverdue: number;
}

export interface UnverifiedListProps {
  data: UnverifiedRow[];
  loading?: boolean;
  regionFilter?: string;
  onRegionFilterChange?: (value: string) => void;
  onExportCSV?: () => void;
  className?: string;
}

const COLS = [
  { key: 'name', header: 'Name' },
  { key: 'region', header: 'Region' },
  { key: 'programme', header: 'Programme' },
  { key: 'daysOverdue', header: 'Days overdue' },
];

export function UnverifiedList({
  data,
  loading = false,
  regionFilter = '',
  onRegionFilterChange,
  onExportCSV,
  className = '',
}: UnverifiedListProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Unverified beneficiaries" description="Proof-of-life overdue; export for field follow-up." />
      <SearchHeader
        title="Unverified list"
        action={onExportCSV ? <Button variant="outline" size="sm" onClick={onExportCSV}>Export CSV</Button> : undefined}
      />
      <Select
        options={REGION_SELECT_OPTIONS}
        value={regionFilter}
        onChange={(e) => onRegionFilterChange?.(e.target.value)}
        inputSize="sm"
        className="w-40"
      />
      <DataTable
        columns={COLS}
        data={data}
        keyExtractor={(r) => r.id}
        emptyMessage={loading ? 'Loading…' : 'No unverified beneficiaries.'}
      />
    </div>
  );
}
