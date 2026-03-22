'use client';

/**
 * Compliance – Ketchup Portal (PRD §3.2.7).
 * Audit logs link, incident reports, unverified beneficiaries; export for BoN.
 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { REGION_SELECT_OPTIONS } from '@/lib/regions';
import { exportToCSV } from '@/lib/export-csv';
import { portalFetch } from '@/lib/portal-fetch';

type Incident = {
  id: string;
  date: string;
  description: string;
  impact: string;
  actionsTaken: string;
  resolution: string;
};

type UnverifiedBeneficiary = {
  id: string;
  name: string;
  region: string;
  daysOverdue: number;
  phone: string;
};

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


export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('incidents');
  const [regionFilter, setRegionFilter] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [unverifiedBeneficiaries, setUnverifiedBeneficiaries] = useState<UnverifiedBeneficiary[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [unverifiedLoading, setUnverifiedLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIncidentsLoading(true);
    portalFetch('/api/v1/incidents')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setIncidents(json.data);
        } else {
          setIncidents([]);
        }
      })
      .catch(() => {
        if (!cancelled) setIncidents([]);
      })
      .finally(() => {
        if (!cancelled) setIncidentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setUnverifiedLoading(true);
    portalFetch('/api/v1/beneficiaries/unverified')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setUnverifiedBeneficiaries(json.data);
        } else {
          setUnverifiedBeneficiaries([]);
        }
      })
      .catch(() => {
        if (!cancelled) setUnverifiedBeneficiaries([]);
      })
      .finally(() => {
        if (!cancelled) setUnverifiedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUnverified = useMemo(() => {
    if (!regionFilter) return unverifiedBeneficiaries;
    return unverifiedBeneficiaries.filter((u) => u.region === regionFilter);
  }, [regionFilter, unverifiedBeneficiaries]);

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
            data={incidents}
            keyExtractor={(r) => r.id}
            emptyMessage={incidentsLoading ? 'Loading incidents...' : 'No incidents reported.'}
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
                onClick={() => exportToCSV(
                  filteredUnverified as Record<string, unknown>[],
                  UNVERIFIED_COLS.map((c) => ({ key: c.key as keyof Record<string, unknown>, header: c.header })),
                  'unverified-beneficiaries.csv'
                )}
              >
                Export for field follow-up
              </Button>
            }
          />
          <Select
            options={REGION_SELECT_OPTIONS}
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            inputSize="sm"
            className="w-40"
          />
          <DataTable
            columns={UNVERIFIED_COLS}
            data={filteredUnverified}
            keyExtractor={(r) => r.id}
            emptyMessage={unverifiedLoading ? 'Loading unverified beneficiaries...' : 'No unverified beneficiaries (proof-of-life overdue >90 days).'}
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
