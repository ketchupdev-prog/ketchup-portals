'use client';

/**
 * ConfirmDialog – Confirmation modal with primary and cancel actions.
 * Location: src/components/ui/confirm-dialog.tsx
 */

import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'success';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message != null && <p className="text-content-muted">{message}</p>}
      <div className="modal-action">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'default'}
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
