'use client';

/**
 * BeneficiaryDetailActions – Suspend/Reactivate, Add voucher, Trigger proof-of-life (PRD §3.2.2).
 * Location: src/components/ketchup/beneficiary-detail-actions.tsx
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export interface BeneficiaryDetailActionsProps {
  beneficiaryId: string;
  beneficiaryName: string;
  status: string;
}

export function BeneficiaryDetailActions({
  beneficiaryId,
  beneficiaryName,
  status,
}: BeneficiaryDetailActionsProps) {
  const { addToast } = useToast();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [addVoucherOpen, setAddVoucherOpen] = useState(false);
  const [triggerPOLOpen, setTriggerPOLOpen] = useState(false);
  const isSuspended = status.toLowerCase() === 'suspended';

  const handleSuspendReactivate = () => {
    setSuspendOpen(false);
    addToast(isSuspended ? 'Beneficiary reactivated.' : 'Beneficiary suspended.', 'success');
  };

  const handleAddVoucher = () => {
    setAddVoucherOpen(false);
    addToast('Voucher added for ' + beneficiaryName + '.', 'success');
  };

  const handleTriggerPOL = async () => {
    try {
      const res = await fetch(`/api/v1/beneficiaries/${beneficiaryId}/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Ketchup SmartPay: Please complete your proof-of-life at an agent. Reply STOP to opt out of SMS.',
        }),
      });
      const json = await res.json();
      setTriggerPOLOpen(false);
      if (!res.ok) {
        addToast(json.error ?? 'Failed to queue SMS.', 'error');
        return;
      }
      addToast('Proof-of-life reminder queued (SMS).', 'success');
    } catch {
      setTriggerPOLOpen(false);
      addToast('Failed to queue SMS.', 'error');
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setSuspendOpen(true)}>
        {isSuspended ? 'Reactivate' : 'Suspend'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setAddVoucherOpen(true)}>
        Add voucher
      </Button>
      <Button variant="outline" size="sm" onClick={() => setTriggerPOLOpen(true)}>
        Trigger proof-of-life
      </Button>
      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={handleSuspendReactivate}
        title={isSuspended ? 'Reactivate beneficiary' : 'Suspend beneficiary'}
        message={
          isSuspended
            ? `Reactivate ${beneficiaryName}? Wallet will be active again.`
            : `Suspend ${beneficiaryName}? Wallet access will be blocked.`
        }
        confirmLabel={isSuspended ? 'Reactivate' : 'Suspend'}
        variant={isSuspended ? 'success' : 'danger'}
      />
      <Modal open={addVoucherOpen} onClose={() => setAddVoucherOpen(false)} title="Manually add voucher">
        <div className="space-y-4">
          <p className="text-sm text-content-muted">Add a voucher for {beneficiaryName}. Amount and programme (wire to API).</p>
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setAddVoucherOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVoucher}>Add voucher</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={triggerPOLOpen}
        onClose={() => setTriggerPOLOpen(false)}
        onConfirm={handleTriggerPOL}
        title="Trigger proof-of-life"
        message={`Send proof-of-life reminder to ${beneficiaryName}? (Push notification and/or SMS to visit agent.)`}
        confirmLabel="Send reminder"
      />
    </>
  );
}
