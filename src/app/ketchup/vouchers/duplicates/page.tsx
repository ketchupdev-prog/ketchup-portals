'use client';

/**
 * Duplicate Redemptions – Ketchup Portal (PRD §3.2.11, §3.3.11).
 * Offline double-redemption events, advance ledger, resolve modal. Data from portal duplicate-redemptions and advance-ledger APIs.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

type DuplicateRow = {
  id: string;
  voucher_id: string;
  voucher_code?: string;
  beneficiary_id: string;
  beneficiary_name: string | null;
  duplicate_amount: string;
  duplicate_agent_name: string | null;
  duplicate_device_id: string | null;
  duplicate_requested_at: string;
  detected_at: string;
  status: string;
  resolution_notes: string | null;
};

type AdvanceLedgerRow = {
  id: string;
  original_amount: string;
  recovered_amount: string;
  outstanding_amount: string;
  cycles_outstanding: number;
  status: string;
  created_at: string;
};

const ADVANCE_COLS = [
  { key: 'original_amount', header: 'Original (NAD)' },
  { key: 'recovered_amount', header: 'Recovered (NAD)' },
  { key: 'outstanding_amount', header: 'Outstanding (NAD)' },
  { key: 'cycles_outstanding', header: 'Cycles' },
  { key: 'status', header: 'Status' },
  { key: 'created_at', header: 'Created' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'advance_posted', label: 'Advance posted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'no_financial_impact', label: 'No financial impact' },
  { value: 'agent_appealing', label: 'Agent appealing' },
  { value: 'resolved', label: 'Resolved' },
];

const RESOLVE_STATUS_OPTIONS = [
  { value: 'advance_posted', label: 'Advance posted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'no_financial_impact', label: 'No financial impact' },
  { value: 'resolved', label: 'Resolved' },
];

const COLS = [
  { key: 'voucher_code', header: 'Voucher' },
  { key: 'beneficiary_name', header: 'Beneficiary' },
  { key: 'duplicate_amount', header: 'Amount (NAD)' },
  { key: 'duplicate_agent_name', header: 'Duplicate agent' },
  { key: 'duplicate_requested_at', header: 'Duplicate at' },
  { key: 'status', header: 'Status', cell: (r: DuplicateRow) => <span className="badge badge-sm">{r.status}</span> },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso.slice(0, 16);
  }
}

export default function DuplicateRedemptionsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    total_duplicates_detected?: number;
    total_over_disbursed_nad?: string;
    total_outstanding?: string;
  }>({});
  const [data, setData] = useState<DuplicateRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DuplicateRow | null>(null);
  const [resolveStatus, setResolveStatus] = useState('resolved');
  const [resolveNotes, setResolveNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Advance ledger expand
  const [expandedBeneficiaryId, setExpandedBeneficiaryId] = useState<string | null>(null);
  const [expandedBeneficiaryName, setExpandedBeneficiaryName] = useState<string>('');
  const [advanceLedger, setAdvanceLedger] = useState<AdvanceLedgerRow[]>([]);
  const [advanceLedgerLoading, setAdvanceLedgerLoading] = useState(false);
  const [totalOutstanding, setTotalOutstanding] = useState<string>('0');

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/advance-ledger/summary');
      const json = await res.json();
      if (res.ok) {
        setSummary({
          total_duplicates_detected: json.total_duplicates_detected ?? 0,
          total_over_disbursed_nad: json.total_over_disbursed_nad ?? '0',
          total_outstanding: json.total_outstanding ?? '0',
        });
      }
    } catch {
      setSummary({});
    }
  }, []);

  const fetchDuplicates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (statusFilter) params.set('status', statusFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    try {
      const res = await fetch(`/api/v1/vouchers/duplicates?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data.map((r: DuplicateRow) => ({
          ...r,
          voucher_code: r.voucher_id.slice(0, 8),
          duplicate_requested_at: formatDate(r.duplicate_requested_at),
        })));
        setTotalRecords(json.meta?.totalRecords ?? json.data.length);
      } else {
        setData([]);
        setTotalRecords(0);
      }
    } catch {
      setData([]);
      setTotalRecords(0);
      addToast('Failed to load duplicate redemptions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, fromDate, toDate, addToast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  const openResolve = (row: DuplicateRow) => {
    setSelectedEvent(row);
    setResolveStatus(row.status === 'resolved' ? 'resolved' : 'under_review');
    setResolveNotes(row.resolution_notes ?? '');
    setResolveModalOpen(true);
  };

  const handleResolveSubmit = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/vouchers/duplicates/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolveStatus, resolution_notes: resolveNotes || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.error ?? 'Update failed.', 'error');
        return;
      }
      setResolveModalOpen(false);
      setSelectedEvent(null);
      addToast('Event updated.', 'success');
      fetchDuplicates();
      fetchSummary();
    } catch {
      addToast('Update failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAdvanceLedger = useCallback(async (beneficiaryId: string, beneficiaryName: string) => {
    if (expandedBeneficiaryId === beneficiaryId) {
      setExpandedBeneficiaryId(null);
      return;
    }
    setExpandedBeneficiaryId(beneficiaryId);
    setExpandedBeneficiaryName(beneficiaryName);
    setAdvanceLedger([]);
    setAdvanceLedgerLoading(true);
    try {
      const res = await fetch(`/api/v1/beneficiaries/${beneficiaryId}/advance-ledger`);
      const json = await res.json();
      if (res.ok) {
        setAdvanceLedger(json.advances ?? []);
        setTotalOutstanding(json.total_outstanding_nad ?? '0');
      }
    } catch {
      setAdvanceLedger([]);
    } finally {
      setAdvanceLedgerLoading(false);
    }
  }, [expandedBeneficiaryId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cols = useMemo(() => [
    ...COLS,
    {
      key: 'actions',
      header: '',
      cell: (r: DuplicateRow) => (
        <div className="flex gap-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAdvanceLedger(r.beneficiary_id, r.beneficiary_name ?? '')}
          >
            {expandedBeneficiaryId === r.beneficiary_id ? 'Hide' : 'Ledger'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => openResolve(r)}>Resolve</Button>
        </div>
      ),
    },
  // openResolve is stable within the render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [expandedBeneficiaryId, fetchAdvanceLedger]);

  const tableRows = data.map((r) => ({
    ...r,
    duplicate_amount: `NAD ${r.duplicate_amount}`,
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Duplicate Redemptions"
        description="Offline double-redemption events; advance recovery and resolution."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Duplicate events (detected)"
          value={summary.total_duplicates_detected ?? 0}
          variant="primary"
        />
        <MetricCard
          title="NAD over-disbursed"
          value={`NAD ${Number(summary.total_over_disbursed_nad ?? 0).toLocaleString()}`}
          variant="warning"
        />
        <MetricCard
          title="Outstanding advances (NAD)"
          value={`NAD ${Number(summary.total_outstanding ?? 0).toLocaleString()}`}
          variant="accent"
        />
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          inputSize="sm"
          className="w-48"
        />
        <input
          type="date"
          className="input input-bordered input-sm w-40"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          placeholder="From"
        />
        <input
          type="date"
          className="input input-bordered input-sm w-40"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          placeholder="To"
        />
        <Button variant="outline" size="sm" onClick={() => { setPage(1); fetchDuplicates(); }}>
          Apply
        </Button>
      </div>
      <DataTable
        columns={cols}
        data={tableRows}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage={loading ? 'Loading…' : 'No duplicate redemption events.'}
      />
      {totalRecords > 0 && (
        <p className="text-sm text-content-muted">
          Page {page} · {totalRecords} total
        </p>
      )}
      {expandedBeneficiaryId && (
        <div className="border border-base-300 rounded-lg p-4 space-y-2">
          <p className="font-medium text-sm">
            Advance ledger — {expandedBeneficiaryName}
            {' · '}
            <span className="text-content-muted">
              Outstanding: NAD {Number(totalOutstanding).toLocaleString()}
            </span>
          </p>
          <DataTable
            columns={ADVANCE_COLS}
            data={advanceLedger}
            keyExtractor={(r) => r.id}
            loading={advanceLedgerLoading}
            emptyMessage={advanceLedgerLoading ? 'Loading…' : 'No advance ledger entries.'}
          />
        </div>
      )}
      <Modal
        open={resolveModalOpen}
        onClose={() => { setResolveModalOpen(false); setSelectedEvent(null); }}
        title="Resolve duplicate event"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <p className="text-sm text-content-muted">
              Voucher {selectedEvent.voucher_id.slice(0, 8)} · {selectedEvent.beneficiary_name ?? '—'} · NAD {selectedEvent.duplicate_amount}
            </p>
            <Select
              label="Status"
              options={RESOLVE_STATUS_OPTIONS}
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value)}
              inputSize="sm"
            />
            <Textarea
              label="Resolution notes"
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
            <div className="modal-action">
              <Button variant="ghost" onClick={() => setResolveModalOpen(false)}>Cancel</Button>
              <Button onClick={handleResolveSubmit} disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
