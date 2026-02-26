'use client';

/**
 * Trust Account Reconciliation – Ketchup Portal (PRD §3.2.6).
 * Uses TrustReconciliation; data from GET /api/v1/reconciliation/daily; adjustment via POST.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TrustReconciliation, type TrustReconciliationRow } from '@/components/ketchup';
import { useToast } from '@/components/ui/toast';

export default function ReconciliationPage() {
  const { addToast } = useToast();
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [internalBalance, setInternalBalance] = useState('NAD 0');
  const [bankBalance, setBankBalance] = useState('NAD 0');
  const [discrepancy, setDiscrepancy] = useState('NAD 0');
  const [entries, setEntries] = useState<TrustReconciliationRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/reconciliation/daily', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setInternalBalance(json.internal_total != null ? `NAD ${Number(json.internal_total).toLocaleString()}` : 'NAD 0');
        setBankBalance(json.bank_total != null ? `NAD ${Number(json.bank_total).toLocaleString()}` : 'NAD 0');
        setDiscrepancy(json.discrepancy != null ? `NAD ${Number(json.discrepancy).toLocaleString()}` : 'NAD 0');
        const raw = json.transaction_entries ?? [];
        let running = 0;
        const mapped: TrustReconciliationRow[] = raw.map((e: { id: string; date: string; type: string; amount: string; reference: string }) => {
          const amt = Number(e.amount) || 0;
          running -= amt; // disbursement reduces trust balance
          return {
            id: e.id,
            date: e.date,
            description: `${e.type} ${e.reference || ''}`.trim() || 'Disbursement',
            debit: amt > 0 ? `NAD ${amt.toLocaleString()}` : '',
            credit: '',
            balance: `NAD ${running.toLocaleString()}`,
          };
        });
        setEntries(mapped);
      })
      .catch(() => { if (!cancelled) setEntries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleFlagDiscrepancy = () => {
    setFlagged(true);
    addToast('Discrepancy flagged for review.', 'warning');
  };

  const handleAddAdjustment = async () => {
    if (!adjustmentReason.trim()) { addToast('Please enter a reason.', 'error'); return; }
    const amount = Number(adjustmentAmount);
    if (Number.isNaN(amount)) { addToast('Enter a valid amount.', 'error'); return; }
    try {
      const res = await fetch('/api/v1/reconciliation/adjustment', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason: adjustmentReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { addToast(json.error ?? 'Failed to submit adjustment.', 'error'); return; }
      setAdjustmentOpen(false);
      setAdjustmentReason('');
      setAdjustmentAmount('');
      addToast('Adjustment submitted for manager approval.', 'success');
    } catch { addToast('Failed to submit adjustment.', 'error'); }
  };

  const summary = {
    totalCredits: bankBalance,
    totalDebits: internalBalance,
    balance: discrepancy,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleFlagDiscrepancy} disabled={flagged}>
          {flagged ? 'Flagged' : 'Flag discrepancy'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAdjustmentOpen(true)}>
          Add adjustment
        </Button>
      </div>
      <TrustReconciliation summary={summary} entries={entries} loading={loading} />
      <Modal open={adjustmentOpen} onClose={() => setAdjustmentOpen(false)} title="Add adjustment">
        <div className="space-y-4">
          <p className="text-sm text-content-muted">
            Adjustment requires a reason and manager approval (dual control).
          </p>
          <Input
            label="Amount (NAD)"
            value={adjustmentAmount}
            onChange={(e) => setAdjustmentAmount(e.target.value)}
            placeholder="0.00"
          />
          <Textarea
            label="Reason"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="Describe the adjustment..."
            rows={3}
          />
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setAdjustmentOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAdjustment}>Submit for approval</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
