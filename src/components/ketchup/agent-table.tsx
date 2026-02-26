'use client';

/**
 * AgentTable – Ketchup Portal agent list (PRD §3.2.4).
 * Filters: region, status (active/suspended), float range.
 * Columns: name, location, float balance, last transaction, terminal ID, actions.
 */

import { useRouter } from 'next/navigation';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { REGION_SELECT_OPTIONS } from '@/lib/regions';

export interface AgentRow {
  id: string;
  name: string;
  location: string;
  floatBalance: string;
  lastTransaction: string;
  terminalId: string;
  status: string;
}

export interface AgentTableProps {
  data: AgentRow[];
  loading?: boolean;
  className?: string;
  regionFilter?: string;
  statusFilter?: string;
  onRegionFilterChange?: (value: string) => void;
  onStatusFilterChange?: (value: string) => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const COLS = [
  { key: 'name', header: 'Name' },
  { key: 'location', header: 'Location' },
  { key: 'floatBalance', header: 'Float balance' },
  { key: 'lastTransaction', header: 'Last transaction' },
  { key: 'terminalId', header: 'Terminal ID' },
  { key: 'status', header: 'Status' },
];

export function AgentTable({
  data,
  loading,
  className = '',
  regionFilter = '',
  statusFilter = '',
  onRegionFilterChange,
  onStatusFilterChange,
}: AgentTableProps) {
  const router = useRouter();
  const cls = className ? `space-y-4 ${className}` : 'space-y-4';

  return (
    <div className={cls}>
      <SearchHeader title="Agents" searchPlaceholder="Search by name or location..." />
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <Select
          options={REGION_SELECT_OPTIONS}
          value={regionFilter}
          onChange={(e) => onRegionFilterChange?.(e.target.value)}
          inputSize="sm"
          className="w-40"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange?.(e.target.value)}
          inputSize="sm"
          className="w-36"
        />
      </div>
      <DataTable
        columns={COLS}
        data={data}
        keyExtractor={(r) => r.id}
        loading={loading}
        onRowClick={(r) => router.push(`/ketchup/agents/${r.id}`)}
        emptyMessage="No agents."
      />
    </div>
  );
}
