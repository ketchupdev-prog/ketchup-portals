'use client';

/**
 * ParcelList – Agent parcel list (incoming + history tabs). PRD §5.2.4.
 * Location: src/components/agent/parcel-list.tsx
 * Uses: SectionHeader, DataTable, Tabs, Button.
 */

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export interface ParcelRow {
  id: string;
  trackingCode: string;
  recipientName: string;
  status: string;
  date?: string;
}

export interface ParcelListProps {
  incoming: ParcelRow[];
  history: ParcelRow[];
  loading?: boolean;
  onScanClick?: () => void;
  className?: string;
}

export function ParcelList({ incoming, history, loading = false, onScanClick, className = '' }: ParcelListProps) {
  const [activeTab, setActiveTab] = useState('incoming');
  const tabs = [
    {
      key: 'incoming',
      label: 'Incoming (ready for collection)',
      content: (
        <div className="space-y-4">
          {onScanClick && <Button size="sm" onClick={onScanClick}>Scan / Mark collected</Button>}
          <DataTable
            columns={[{ key: 'trackingCode', header: 'Tracking' }, { key: 'recipientName', header: 'Recipient' }, { key: 'status', header: 'Status' }]}
            data={incoming}
            keyExtractor={(r) => r.id}
            emptyMessage={loading ? 'Loading…' : 'No parcels ready for collection.'}
          />
        </div>
      ),
    },
    {
      key: 'history',
      label: 'History',
      content: (
        <DataTable
          columns={[{ key: 'trackingCode', header: 'Tracking' }, { key: 'recipientName', header: 'Recipient' }, { key: 'status', header: 'Status' }, { key: 'date', header: 'Date' }]}
          data={history}
          keyExtractor={(r) => r.id}
          emptyMessage={loading ? 'Loading…' : 'No parcel history.'}
        />
      ),
    },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Parcel management" description="Incoming parcels, scan to mark collected, history." />
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="bordered" />
    </div>
  );
}
