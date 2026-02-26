'use client';

/**
 * AssetList – Field Ops list of assets (units, ATMs) with type filter and tabs. PRD §6.2.2.
 * Location: src/components/field-ops/asset-list.tsx
 * Uses: SectionHeader, DataTable, Tabs, Select.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SectionHeader } from '@/components/ui/section-header';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';

export interface AssetRow {
  id: string;
  type: string;
  name: string;
  driver: string;
  location: string;
  lastActivity: string;
  lastMaintenance: string;
  cashLevel: string;
  status: string;
}

export interface AssetListProps {
  units: AssetRow[];
  atms: AssetRow[];
  loading?: boolean;
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
  detailPathPrefix?: string;
  className?: string;
}

export function AssetList({
  units,
  atms,
  loading = false,
  typeFilter = '',
  onTypeFilterChange,
  detailPathPrefix = '/field-ops/assets',
  className = '',
}: AssetListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('units');

  const unitCols = [
    { key: 'name', header: 'Name' },
    { key: 'driver', header: 'Driver' },
    { key: 'location', header: 'Location' },
    { key: 'lastActivity', header: 'Last activity' },
    { key: 'status', header: 'Status' },
  ];
  const atmCols = [
    { key: 'name', header: 'Location' },
    { key: 'cashLevel', header: 'Cash level' },
    { key: 'status', header: 'Status' },
    { key: 'lastMaintenance', header: 'Last maintenance' },
  ];

  const tabs = [
    {
      key: 'units',
      label: 'Mobile units',
      content: (
        <DataTable
          columns={unitCols}
          data={units}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`${detailPathPrefix}/${r.id}`)}
          emptyMessage={loading ? 'Loading…' : 'No mobile units.'}
        />
      ),
    },
    {
      key: 'atms',
      label: 'ATMs',
      content: (
        <DataTable
          columns={atmCols}
          data={atms}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`${detailPathPrefix}/${r.id}`)}
          emptyMessage={loading ? 'Loading…' : 'No ATMs.'}
        />
      ),
    },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Assets" description="Mobile units and ATMs; maintenance and replenishment." />
      {onTypeFilterChange && (
        <Select
          options={[{ value: '', label: 'All types' }, { value: 'mobile', label: 'Mobile' }, { value: 'atm', label: 'ATM' }]}
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          inputSize="sm"
          className="w-36"
        />
      )}
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="bordered" />
    </div>
  );
}
