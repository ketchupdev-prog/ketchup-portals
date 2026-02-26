'use client';

/**
 * ParcelScan – Modal to scan/enter tracking code and mark parcel collected. PRD §5.2.4.
 * Location: src/components/agent/parcel-scan.tsx
 * Uses: Modal, Input, Button.
 */

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface ParcelScanProps {
  open: boolean;
  onClose: () => void;
  onMarkCollected: (trackingCode: string) => Promise<void>;
  loading?: boolean;
}

export function ParcelScan({ open, onClose, onMarkCollected, loading = false }: ParcelScanProps) {
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    await onMarkCollected(trimmed);
    setCode('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Scan parcel / Mark collected">
      <div className="space-y-4">
        <Input label="Tracking code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter or scan code" />
        <div className="modal-action">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>Mark collected</Button>
        </div>
      </div>
    </Modal>
  );
}
