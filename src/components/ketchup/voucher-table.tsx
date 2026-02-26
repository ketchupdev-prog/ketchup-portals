'use client';

/**
 * VoucherTable – Ketchup Portal voucher list (PRD §3.2.3).
 * Columns: voucher ID, amount, programme, beneficiary, status, expiry, actions.
 * Filters: status, programme, region, issue date.
 */

import { useRouter } from 'next/navigation';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export interface VoucherRow {
  id: string;
  code: string;
  beneficiaryName: string;
  amount: string;
  programme: string;
  status: string;
  issuedAt: string;
  expiry: string;
}

export interface VoucherTableProps {
  data: VoucherRow[];
  loading?: boolean;
  className?: string;
  statusFilter?: string;
  programmeFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  onProgrammeFilterChange?: (value: string) => void;
  onIssueVoucher?: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'available', label: 'Available' },
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'expired', label: 'Expired' },
];

const PROGRAMME_OPTIONS = [
  { value: '', label: 'All programmes' },
  { value: 'p1', label: 'Programme 1' },
  { value: 'p2', label: 'Programme 2' },
];

const COLS = [
  { key: 'code', header: 'Voucher ID' },
  { key: 'amount', header: 'Amount' },
  { key: 'programme', header: 'Programme' },
  { key: 'beneficiaryName', header: 'Beneficiary' },
  { key: 'status', header: 'Status' },
  { key: 'expiry', header: 'Expiry' },
  { key: 'issuedAt', header: 'Issued' },
];

export function VoucherTable({
  data,
  loading,
  className = '',
  statusFilter = '',
  programmeFilter = '',
  onStatusFilterChange,
  onProgrammeFilterChange,
  onIssueVoucher,
}: VoucherTableProps) {
  const router = useRouter();
  const cls = className ? `space-y-4 ${className}` : 'space-y-4';

  return (
    <div className={cls}>
      <SearchHeader
        title="Vouchers"
        searchPlaceholder="Search by voucher or beneficiary..."
        action={
          onIssueVoucher && (
            <Button size="sm" onClick={onIssueVoucher}>
              Issue voucher
            </Button>
          )
        }
      />
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange?.(e.target.value)}
          inputSize="sm"
          className="w-40"
        />
        <Select
          options={PROGRAMME_OPTIONS}
          value={programmeFilter}
          onChange={(e) => onProgrammeFilterChange?.(e.target.value)}
          inputSize="sm"
          className="w-44"
        />
      </div>
      <DataTable
        columns={COLS}
        data={data}
        keyExtractor={(row) => row.id}
        loading={loading}
        onRowClick={(row) => router.push(`/ketchup/vouchers/${row.id}`)}
        emptyMessage="No vouchers."
      />
    </div>
  );
}
