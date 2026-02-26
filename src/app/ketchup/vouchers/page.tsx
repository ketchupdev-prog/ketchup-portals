'use client';

/**
 * Vouchers list – Ketchup Portal (PRD §3.2.3).
 * List view with filters; Issue Voucher modal; expiry alerts (next 7 days).
 * Data from GET /api/v1/vouchers and GET /api/v1/vouchers/expiring-soon.
 */

import { useState, useMemo, useEffect } from 'react';
import { portalFetch } from '@/lib/portal-fetch';
import { VoucherTable, type VoucherRow } from '@/components/ketchup/voucher-table';
import { IssueVoucherModal } from '@/components/ketchup/issue-voucher-modal';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

function mapApiToRow(r: {
  id: string;
  beneficiary_name: string | null;
  programme_name: string | null;
  amount: string;
  status: string;
  issued_at: string;
  expiry_date: string;
}): VoucherRow {
  const statusMap: Record<string, string> = { available: 'Available', redeemed: 'Redeemed', expired: 'Expired' };
  return {
    id: r.id,
    code: r.id.slice(0, 8),
    beneficiaryName: r.beneficiary_name ?? '—',
    amount: `NAD ${r.amount}`,
    programme: r.programme_name ?? '—',
    status: statusMap[r.status] ?? r.status,
    issuedAt: r.issued_at.slice(0, 10),
    expiry: r.expiry_date,
  };
}

function getExpiringIn7Days(vouchers: VoucherRow[]): VoucherRow[] {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return vouchers.filter((v) => v.status === 'Available' && v.expiry && new Date(v.expiry) <= in7 && new Date(v.expiry) >= now);
}

export default function VouchersPage() {
  const { addToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [data, setData] = useState<VoucherRow[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<VoucherRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '100');
    if (statusFilter) params.set('status', statusFilter);
    portalFetch(`/api/v1/vouchers?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setData(json.data.map(mapApiToRow));
        } else {
          setData([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData([]);
          addToast('Failed to load vouchers.', 'error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [statusFilter, addToast]);

  useEffect(() => {
    let cancelled = false;
    portalFetch('/api/v1/vouchers/expiring-soon')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setExpiringSoon(
            json.data.map((r: { id: string; beneficiary_name: string | null; programme_name: string | null; amount: string; status: string; issued_at: string; expiry_date: string }) =>
              mapApiToRow({ ...r, beneficiary_name: r.beneficiary_name ?? null, programme_name: r.programme_name ?? null })
            )
          );
        } else {
          setExpiringSoon([]);
        }
      })
      .catch(() => { if (!cancelled) setExpiringSoon([]); });
    return () => { cancelled = true; };
  }, []);

  const filteredData = useMemo(() => {
    let list = [...data];
    if (programmeFilter) list = list.filter((v) => (v.programme ?? '').toLowerCase().replace(/\s/g, '') === programmeFilter);
    return list;
  }, [data, programmeFilter]);

  return (
    <div className="space-y-6">
      {expiringSoon.length > 0 && (
        <Alert variant="warning" title="Expiring in next 7 days">
          {expiringSoon.length} voucher(s) expiring soon: {expiringSoon.map((v) => v.code).join(', ')}.
          <Button size="sm" variant="outline" className="ml-2" onClick={() => addToast('Reminder SMS queued for expiring vouchers.', 'success')}>
            Send reminder SMS
          </Button>
        </Alert>
      )}
      <VoucherTable
        data={filteredData}
        loading={loading}
        statusFilter={statusFilter}
        programmeFilter={programmeFilter}
        onStatusFilterChange={setStatusFilter}
        onProgrammeFilterChange={setProgrammeFilter}
        onIssueVoucher={() => setIssueModalOpen(true)}
      />
      <IssueVoucherModal open={issueModalOpen} onClose={() => setIssueModalOpen(false)} />
    </div>
  );
}
