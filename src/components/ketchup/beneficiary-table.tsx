'use client';

/**
 * BeneficiaryTable – Ketchup Portal beneficiary list with PRD-aligned columns and filters.
 * Location: src/components/ketchup/beneficiary-table.tsx
 * PRD: §3.2.2 Beneficiary Management – List View (region, verification status, wallet status, programme).
 */

import { useRouter } from 'next/navigation';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { REGION_SELECT_OPTIONS } from '@/lib/regions';

export interface BeneficiaryRow {
  id: string;
  name: string;
  phone: string;
  region: string;
  lastProofOfLife: string;
  walletStatus: string;
  programme?: string;
}

export interface BeneficiaryTableProps {
  data: BeneficiaryRow[];
  loading?: boolean;
  className?: string;
  /** Filter state (controlled from page for future API) */
  regionFilter?: string;
  verificationFilter?: string;
  walletFilter?: string;
  programmeFilter?: string;
  onRegionFilterChange?: (value: string) => void;
  onVerificationFilterChange?: (value: string) => void;
  onWalletFilterChange?: (value: string) => void;
  onProgrammeFilterChange?: (value: string) => void;
  /** Bulk actions (export CSV, send SMS) – optional */
  onExportCSV?: () => void;
  onSendSMSReminder?: () => void;
}

const VERIFICATION_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'verified', label: 'Verified' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'frozen', label: 'Frozen' },
];

const WALLET_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const COLS: Column<BeneficiaryRow>[] = [
  { key: 'name', header: 'Name' },
  { key: 'phone', header: 'Phone' },
  { key: 'region', header: 'Region' },
  { key: 'lastProofOfLife', header: 'Last proof of life' },
  { key: 'walletStatus', header: 'Wallet status' },
];

export function BeneficiaryTable(props: BeneficiaryTableProps) {
  const {
    data,
    loading,
    className = '',
    regionFilter = '',
    verificationFilter = '',
    walletFilter = '',
    programmeFilter = '',
    onRegionFilterChange,
    onVerificationFilterChange,
    onWalletFilterChange,
    onProgrammeFilterChange,
    onExportCSV,
    onSendSMSReminder,
  } = props;
  const router = useRouter();
  const cls = className ? `space-y-4 ${className}` : 'space-y-4';

  return (
    <div className={cls}>
      <SearchHeader
        title="Beneficiaries"
        searchPlaceholder="Search by name or phone..."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {(onExportCSV || onSendSMSReminder) && (
              <>
                {onExportCSV && (
                  <Button variant="outline" size="sm" onClick={onExportCSV}>
                    Export CSV
                  </Button>
                )}
                {onSendSMSReminder && (
                  <Button variant="outline" size="sm" onClick={onSendSMSReminder}>
                    Send SMS reminder
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <Select
          options={REGION_SELECT_OPTIONS}
          value={regionFilter}
          onChange={(e) => onRegionFilterChange?.(e.target.value)}
          inputSize="sm"
          className="w-40"
        />
        <Select
          options={VERIFICATION_OPTIONS}
          value={verificationFilter}
          onChange={(e) => onVerificationFilterChange?.(e.target.value)}
          inputSize="sm"
          className="w-40"
        />
        <Select
          options={WALLET_OPTIONS}
          value={walletFilter}
          onChange={(e) => onWalletFilterChange?.(e.target.value)}
          inputSize="sm"
          className="w-36"
        />
        {onProgrammeFilterChange && (
          <Select
            options={[{ value: '', label: 'All programmes' }, { value: 'p1', label: 'Programme 1' }]}
            value={programmeFilter ?? ''}
            onChange={(e) => onProgrammeFilterChange?.(e.target.value)}
            inputSize="sm"
            className="w-44"
          />
        )}
      </div>
      <DataTable
        columns={COLS}
        data={data}
        keyExtractor={(r) => r.id}
        loading={loading}
        onRowClick={(r) => router.push(`/ketchup/beneficiaries/${r.id}`)}
        emptyMessage="No beneficiaries."
      />
    </div>
  );
}
