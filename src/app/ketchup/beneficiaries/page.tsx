'use client';

/**
 * Beneficiaries list – Ketchup Portal.
 * PRD §3.2.2: List view with filters; Export CSV and Send SMS reminder.
 * Data from GET /api/v1/beneficiaries (paginated).
 */

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { portalFetch } from '@/lib/portal-fetch';
import { BeneficiaryTable, type BeneficiaryRow } from '@/components/ketchup/beneficiary-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { exportToCSV, buildCSVFilename } from '@/lib/export-csv';

const REGION_KEY = 'region';
const WALLET_KEY = 'status';
const VERIFICATION_KEY = 'verification';


function mapApiToRow(r: { id: string; full_name: string; phone: string; region: string | null; wallet_status: string; proof_of_life_due_date: string | null }): BeneficiaryRow {
  return {
    id: r.id,
    name: r.full_name,
    phone: r.phone ?? '',
    region: r.region ?? '',
    lastProofOfLife: r.proof_of_life_due_date ? r.proof_of_life_due_date.slice(0, 10) : '',
    walletStatus: r.wallet_status ?? 'active',
  };
}

function BeneficiariesListContent() {
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [regionFilter, setRegionFilter] = useState(() => searchParams.get(REGION_KEY) ?? '');
  const [verificationFilter, setVerificationFilter] = useState(() => searchParams.get(VERIFICATION_KEY) ?? '');
  const [walletFilter, setWalletFilter] = useState(() => searchParams.get(WALLET_KEY) ?? '');
  const [loading, setLoading] = useState(true);
  const [smsConfirmOpen, setSmsConfirmOpen] = useState(false);
  const [data, setData] = useState<BeneficiaryRow[]>([]);

  const setFiltersInUrl = useCallback((region: string, wallet: string, verification: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (region) next.set(REGION_KEY, region); else next.delete(REGION_KEY);
    if (wallet) next.set(WALLET_KEY, wallet); else next.delete(WALLET_KEY);
    if (verification) next.set(VERIFICATION_KEY, verification); else next.delete(VERIFICATION_KEY);
    router.replace(`/ketchup/beneficiaries?${next.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '100');
    if (regionFilter) params.set('region', regionFilter);
    if (walletFilter) params.set('status', walletFilter);
    portalFetch(`/api/v1/beneficiaries?${params.toString()}`)
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
          addToast('Failed to load beneficiaries.', 'error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [regionFilter, walletFilter, addToast]);

  const filteredData = useMemo(() => data, [data]);

  const handleExportCSV = () => {
    exportToCSV(
      filteredData,
      [
        { key: 'name', header: 'name' },
        { key: 'phone', header: 'phone' },
        { key: 'region', header: 'region' },
        { key: 'lastProofOfLife', header: 'lastProofOfLife' },
        { key: 'walletStatus', header: 'walletStatus' },
      ],
      buildCSVFilename('beneficiaries')
    );
    addToast('CSV exported.', 'success');
  };

  const handleSendSMSReminder = () => {
    setSmsConfirmOpen(true);
  };

  const handleConfirmSMS = async () => {
    const ids = filteredData.map((r) => r.id);
    if (ids.length === 0) {
      addToast('No beneficiaries to send to.', 'error');
      setSmsConfirmOpen(false);
      return;
    }
    try {
      const res = await portalFetch('/api/v1/beneficiaries/bulk-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiary_ids: ids,
          message: 'Ketchup SmartPay: Please complete your proof-of-life at an agent. Reply STOP to opt out of SMS.',
        }),
      });
      const json = await res.json();
      setSmsConfirmOpen(false);
      if (!res.ok) {
        addToast(json.error ?? 'Failed to queue SMS.', 'error');
        return;
      }
      addToast(json.message ?? `${json.queued ?? 0} SMS queued.`, 'success');
    } catch {
      setSmsConfirmOpen(false);
      addToast('Failed to queue SMS.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <BeneficiaryTable
        data={filteredData}
        loading={loading}
        regionFilter={regionFilter}
        verificationFilter={verificationFilter}
        walletFilter={walletFilter}
        onRegionFilterChange={(v) => { setRegionFilter(v); setFiltersInUrl(v, walletFilter, verificationFilter); }}
        onVerificationFilterChange={(v) => { setVerificationFilter(v); setFiltersInUrl(regionFilter, walletFilter, v); }}
        onWalletFilterChange={(v) => { setWalletFilter(v); setFiltersInUrl(regionFilter, v, verificationFilter); }}
        onExportCSV={handleExportCSV}
        onSendSMSReminder={handleSendSMSReminder}
      />
      <ConfirmDialog
        open={smsConfirmOpen}
        onClose={() => setSmsConfirmOpen(false)}
        onConfirm={handleConfirmSMS}
        title="Send SMS reminder"
        message="Send proof-of-life SMS reminder to all filtered beneficiaries? This will trigger a push/SMS to visit an agent."
        confirmLabel="Send reminder"
        cancelLabel="Cancel"
        variant="primary"
      />
    </div>
  );
}

export default function BeneficiariesPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><div className="skeleton h-12 w-full" /><div className="skeleton h-64 w-full" /></div>}>
      <BeneficiariesListContent />
    </Suspense>
  );
}
