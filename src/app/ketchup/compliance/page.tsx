'use client';

/**
 * Compliance – Ketchup Portal (PRD §3.2.7).
 * Audit logs link, incident reports, unverified beneficiaries; export for BoN.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

const SAMPLE_INCIDENTS = [
  { id: 'i1', date: '2025-02-20', description: 'Suspicious redemption pattern', impact: 'Low', actionsTaken: 'Account reviewed', resolution: 'Resolved – beneficiary verified' },
  { id: 'i2', date: '2025-02-18', description: 'Duplicate voucher attempt', impact: 'Medium', actionsTaken: 'Voucher blocked', resolution: 'Pending' },
];

const SAMPLE_UNVERIFIED = [
  { id: 'b1', name: 'John Doe', region: 'Khomas', daysOverdue: 95, phone: '+264 81 123 4567' },
  { id: 'b2', name: 'Jane Smith', region: 'Erongo', daysOverdue: 120, phone: '+264 81 234 5678' },
];

const INCIDENT_COLS = [
  { key: 'date', header: 'Date' },
  { key: 'description', header: 'Description' },
  { key: 'impact', header: 'Impact' },
  { key: 'actionsTaken', header: 'Actions taken' },
  { key: 'resolution', header: 'Resolution' },
];

const UNVERIFIED_COLS = [
  { key: 'name', header: 'Name' },
  { key: 'region', header: 'Region' },
  { key: 'daysOverdue', header: 'Days overdue' },
  { key: 'phone', header: 'Phone' },
];

function exportCSV(rows: Record<string, string | number>[], columns: { key: string; header: string }[], filename: string) {
  const header = columns.map((c) => c.header).join(',');
  const body = rows.map((r) => columns.map((c) => String(r[c.key] ?? '')).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('incidents');
  const [regionFilter, setRegionFilter] = useState('');

  const filteredUnverified = useMemo(() => {
    if (!regionFilter) return SAMPLE_UNVERIFIED;
    return SAMPLE_UNVERIFIED.filter((u) => u.region === regionFilter);
  }, [regionFilter]);

  const tabs = [
    {
      key: 'incidents',
      label: 'Incident reports',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-content-muted">
            PSD‑12 incident reports. Add resolution notes; notifies BoN compliance officer.
          </p>
          <DataTable
            columns={INCIDENT_COLS}
            data={SAMPLE_INCIDENTS}
            keyExtractor={(r) => r.id}
            emptyMessage="No incidents."
          />
        </div>
      ),
    },
    {
      key: 'unverified',
      label: 'Unverified beneficiaries',
      content: (
        <div className="space-y-4">
          <SearchHeader
            title="Unverified beneficiaries"
            searchPlaceholder="Search..."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV(filteredUnverified, UNVERIFIED_COLS, 'unverified-beneficiaries.csv')}
              >
                Export for field follow-up
              </Button>
            }
          />
          <Select
            options={[{ value: '', label: 'All regions' }, { value: 'Khomas', label: 'Khomas' }, { value: 'Erongo', label: 'Erongo' }]}
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            inputSize="sm"
            className="w-40"
          />
          <DataTable
            columns={UNVERIFIED_COLS}
            data={filteredUnverified}
            keyExtractor={(r) => r.id}
            emptyMessage="No unverified beneficiaries (proof-of-life overdue >90 days)."
          />
        </div>
      ),
    },
    {
      key: 'audit',
      label: 'Audit logs',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-content-muted">
            Searchable audit logs by user, action, date range. Export to CSV.
          </p>
          <Link href="/ketchup/audit" className="btn btn-primary">
            Open audit logs
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Compliance"
        description="Audit logs, incident reports, unverified beneficiaries; export for BoN."
      />
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="bordered" />
    </div>
  );
}
