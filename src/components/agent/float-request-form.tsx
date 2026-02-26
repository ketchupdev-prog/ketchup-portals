'use client';

/**
 * FloatRequestForm – Agent float top-up request form (modal or inline). PRD §5.2.2.
 * Location: src/components/agent/float-request-form.tsx
 * Uses: Modal, Input, Button.
 */

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FloatRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
  loading?: boolean;
}

export function FloatRequestForm({ open, onClose, onSubmit, loading = false }: FloatRequestFormProps) {
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    const num = Number(amount);
    if (Number.isNaN(num) || num <= 0) return;
    await onSubmit(num);
    setAmount('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Request top-up">
      <div className="space-y-4">
        <Input label="Amount (NAD)" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" />
        <div className="modal-action">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>Submit request</Button>
        </div>
      </div>
    </Modal>
  );
}
