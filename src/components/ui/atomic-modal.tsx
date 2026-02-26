'use client';

/**
 * AtomicModal – Modal for atomic record details (e.g. single transaction, proof-of-life event).
 * Location: src/components/ui/atomic-modal.tsx
 */

import { Modal } from './modal';
import { cn } from '@/lib/utils';

export interface AtomicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AtomicModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
}: AtomicModalProps) {
  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={title} className={className}>
      {description != null && (
        <p className="text-sm text-content-muted mb-4">{description}</p>
      )}
      <div className="max-h-[70vh] overflow-y-auto pr-2">{children}</div>
    </Modal>
  );
}
