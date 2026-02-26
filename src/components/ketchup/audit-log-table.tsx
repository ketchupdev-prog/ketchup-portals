'use client';

/**
 * AuditLogTable – Ketchup audit log entries with filters. PRD §3.x.
 * Location: src/components/ketchup/audit-log-table.tsx
 * Uses: SectionHeader, SearchHeader, DataTable, Select.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export interface AuditLogRow {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details?: string;
}

export interface AuditLogTableProps {
  data: AuditLogRow[];
  loading?: boolean;
  actionFilter?: string;
  onActionFilterChange?: (value: string) => void;
  onExport?: () => void;
  className?: string;
}

const COLS = [
  { key: 'timestamp', header: 'Time' },
  { key: 'actor', header: 'Actor' },
  { key: 'action', header: 'Action' },
  { key: 'resource', header: 'Resource' },
  { key: 'details', header: 'Details' },
];

export function AuditLogTable({
  data,
  loading = false,
  actionFilter = '',
  onActionFilterChange,
  onExport,
  className = '',
}: AuditLogTableProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Audit log" description="System and user actions." />
      <SearchHeader
        title="Audit entries"
        action={onExport ? <Button size="sm" variant="outline" onClick={onExport}>Export CSV</Button> : undefined}
      />
      {onActionFilterChange && (
        <Select
          options={[{ value: '', label: 'All actions' }, { value: 'login', label: 'Login' }, { value: 'voucher_issue', label: 'Voucher issue' }, { value: 'float_approve', label: 'Float approve' }]}
          value={actionFilter}
          onChange={(e) => onActionFilterChange(e.target.value)}
          inputSize="sm"
          className="w-44"
        />
      )}
      <DataTable columns={COLS} data={data} keyExtractor={(r) => r.id} emptyMessage={loading ? 'Loading…' : 'No audit entries.'} />
    </div>
  );
}
