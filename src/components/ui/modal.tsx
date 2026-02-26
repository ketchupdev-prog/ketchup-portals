'use client';

/**
 * Modal – Reusable modal dialog. Uses DaisyUI modal.
 * Location: src/components/ui/modal.tsx
 */

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog className={cn('modal modal-open', className)}>
      <div className="modal-box">
        {title != null && (
          <h3 className="font-bold text-lg">{title}</h3>
        )}
        <div className="py-4">{children}</div>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button type="submit" className="w-full h-full min-h-screen cursor-default" aria-label="Close modal" onClick={onClose} />
      </form>
    </dialog>
  );
}
