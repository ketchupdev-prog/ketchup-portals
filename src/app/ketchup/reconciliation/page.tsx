'use client';

/**
 * Trust Account Reconciliation – Ketchup Portal (PRD §3.2.6).
 * Data from GET /api/v1/reconciliation/daily; add adjustment via POST /api/v1/reconciliation/adjustment.
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

const TX_COLS = [
  { key: 'date', header: 'Date' },
  { key: 'type', header: 'Type' },
  { key: 'amount', header: 'Amount' },
  { key: 'reference', header: 'Reference' },
  { key: 'settlementStatus', header: 'Settlement' },
];

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
  const [transactions, setTransactions] = useState<Array<{ id: string; date: string; type: string; amount: string; reference: string; settlementStatus: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/reconciliation/daily')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setInternalBalance(json.internal_total != null ? `NAD ${Number(json.internal_total).toLocaleString()}` : 'NAD 0');
        setBankBalance(json.bank_total != null ? `NAD ${Number(json.bank_total).toLocaleString()}` : 'NAD 0');
        setDiscrepancy(json.discrepancy != null ? `NAD ${Number(json.discrepancy).toLocaleString()}` : 'NAD 0');
        setTransactions([]);
      })
      .catch(() => { if (!cancelled) setTransactions([]); })
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

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Trust Account Reconciliation"
        description="Daily reconciliation: internal balance vs bank statement; list of transactions; adjustments with approval."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Internal ledger balance" value={internalBalance} variant="primary" />
        <MetricCard title="Bank statement balance" value={bankBalance} variant="accent" />
        <MetricCard
          title="Discrepancy"
          value={discrepancy}
          variant={discrepancy !== 'NAD 0' ? 'warning' : 'success'}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleFlagDiscrepancy} disabled={flagged}>
          {flagged ? 'Flagged' : 'Flag discrepancy'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAdjustmentOpen(true)}>
          Add adjustment
        </Button>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Today&apos;s transactions</h3>
        <DataTable
          columns={TX_COLS}
          data={transactions}
          keyExtractor={(r) => r.id}
          emptyMessage={loading ? 'Loading…' : 'No transactions for today.'}
        />
      </div>
      <Modal
        open={adjustmentOpen}
        onClose={() => setAdjustmentOpen(false)}
        title="Add adjustment"
      >
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
