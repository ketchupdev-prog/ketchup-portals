'use client';

/**
 * UnverifiedBeneficiaries – Ketchup list of unverified/overdue beneficiaries. PRD §3.x.
 * Location: src/components/ketchup/unverified-beneficiaries.tsx
 * Uses: SectionHeader, DataTable, Select, Button.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { REGION_SELECT_OPTIONS } from '@/lib/regions';

export interface UnverifiedBeneficiaryRow {
  id: string;
  name: string;
  region: string;
  programme: string;
  daysOverdue: number;
}

export interface UnverifiedBeneficiariesProps {
  data: UnverifiedBeneficiaryRow[];
  loading?: boolean;
  regionFilter?: string;
  onRegionFilterChange?: (value: string) => void;
  onExportCSV?: () => void;
  onSendReminder?: () => void;
  className?: string;
}

const COLS = [
  { key: 'name', header: 'Name' },
  { key: 'region', header: 'Region' },
  { key: 'programme', header: 'Programme' },
  { key: 'daysOverdue', header: 'Days overdue' },
];

export function UnverifiedBeneficiaries({
  data,
  loading = false,
  regionFilter = '',
  onRegionFilterChange,
  onExportCSV,
  onSendReminder,
  className = '',
}: UnverifiedBeneficiariesProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Unverified beneficiaries" description="Proof-of-life overdue; send reminders or export." />
      <SearchHeader
        title="Unverified list"
        action={
          <div className="flex gap-2">
            {onExportCSV && <Button variant="outline" size="sm" onClick={onExportCSV}>Export CSV</Button>}
            {onSendReminder && <Button variant="outline" size="sm" onClick={onSendReminder}>Send SMS reminder</Button>}
          </div>
        }
      />
      {onRegionFilterChange && (
        <Select options={REGION_SELECT_OPTIONS} value={regionFilter} onChange={(e) => onRegionFilterChange(e.target.value)} inputSize="sm" className="w-40" />
      )}
      <DataTable columns={COLS} data={data} keyExtractor={(r) => r.id} emptyMessage={loading ? 'Loading…' : 'No unverified beneficiaries.'} />
    </div>
  );
}
