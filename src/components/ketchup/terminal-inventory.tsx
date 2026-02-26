'use client';

/**
 * TerminalInventory – Ketchup list/grid of terminals per agent or global. PRD §3.x.
 * Location: src/components/ketchup/terminal-inventory.tsx
 * Uses: SectionHeader, DataTable, Select, SearchHeader.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';

export interface TerminalInventoryRow {
  id: string;
  terminalId: string;
  agentName: string;
  status: string;
  lastUsed?: string;
}

export interface TerminalInventoryProps {
  data: TerminalInventoryRow[];
  loading?: boolean;
  agentFilter?: string;
  onAgentFilterChange?: (value: string) => void;
  className?: string;
}

const COLS = [
  { key: 'terminalId', header: 'Terminal ID' },
  { key: 'agentName', header: 'Agent' },
  { key: 'status', header: 'Status' },
  { key: 'lastUsed', header: 'Last used' },
];

export function TerminalInventory({
  data,
  loading = false,
  agentFilter = '',
  onAgentFilterChange,
  className = '',
}: TerminalInventoryProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Terminal inventory" description="Terminals assigned to agents." />
      <SearchHeader title="Terminals" />
      {onAgentFilterChange && (
        <Select
          options={[{ value: '', label: 'All agents' }, { value: 'a1', label: 'Agent 1' }]}
          value={agentFilter}
          onChange={(e) => onAgentFilterChange(e.target.value)}
          inputSize="sm"
          className="w-40"
        />
      )}
      <DataTable
        columns={COLS}
        data={data}
        keyExtractor={(r) => r.id}
        emptyMessage={loading ? 'Loading…' : 'No terminals.'}
      />
    </div>
  );
}
