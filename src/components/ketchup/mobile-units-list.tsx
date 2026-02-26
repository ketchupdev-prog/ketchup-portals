'use client';

/**
 * MobileUnitsList – List view of mobile units and ATMs (PRD §3.2.5).
 * Location: src/components/ketchup/mobile-units-list.tsx
 */

import { useRouter } from 'next/navigation';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { useState } from 'react';

export interface MobileUnitRow {
  id: string;
  type: 'mobile';
  driver: string;
  location: string;
  lastActivity: string;
  nextMaintenance: string;
  status: string;
}

export interface AtmRow {
  id: string;
  type: 'atm';
  location: string;
  cashLevel: string;
  status: string;
  lastReplenishment: string;
}

const UNIT_COLS = [
  { key: 'driver', header: 'Driver' },
  { key: 'location', header: 'Location' },
  { key: 'lastActivity', header: 'Last activity' },
  { key: 'nextMaintenance', header: 'Next maintenance' },
  { key: 'status', header: 'Status' },
];

const ATM_COLS = [
  { key: 'location', header: 'Location' },
  { key: 'cashLevel', header: 'Cash level' },
  { key: 'status', header: 'Status' },
  { key: 'lastReplenishment', header: 'Last replenishment' },
];

export interface MobileUnitsListProps {
  units?: MobileUnitRow[];
  atms?: AtmRow[];
  loading?: boolean;
  onViewMap?: () => void;
}

export function MobileUnitsList({ units = [], atms = [], loading = false, onViewMap }: MobileUnitsListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('units');

  const tabs = [
    { key: 'units', label: 'Mobile units', content: (
      <DataTable
        columns={UNIT_COLS}
        data={units}
        keyExtractor={(r) => r.id}
        loading={loading}
        onRowClick={(r) => router.push(`/ketchup/mobile-units/${r.id}`)}
        emptyMessage="No mobile units."
      />
    ) },
    { key: 'atms', label: 'ATMs', content: (
      <DataTable
        columns={ATM_COLS}
        data={atms}
        keyExtractor={(r) => r.id}
        loading={loading}
        onRowClick={(r) => router.push(`/ketchup/mobile-units/${r.id}`)}
        emptyMessage="No ATMs."
      />
    ) },
  ];

  return (
    <div className="space-y-4">
      <SearchHeader
        title="Mobile Units & ATMs"
        searchPlaceholder="Search by driver or location..."
        action={
          onViewMap && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onViewMap}>
              View map
            </button>
          )
        }
      />
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="bordered" />
    </div>
  );
}
