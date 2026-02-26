'use client';

/**
 * Lightbox – Full-screen image viewer. Uses Modal.
 * Location: src/components/ui/lightbox.tsx
 */

import { Modal } from './modal';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface LightboxProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
}

export function Lightbox({ open, onClose, src, alt = '', caption, className = '' }: LightboxProps) {
  return (
    <Modal open={open} onClose={onClose} className={cn('modal-lg', className)}>
      <div className="relative w-full max-h-[85vh] flex flex-col items-center">
        <div className="relative w-full aspect-video max-h-[70vh] bg-base-200 rounded-lg overflow-hidden">
          <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" />
        </div>
        {caption != null && <p className="text-sm text-content-muted mt-2 text-center">{caption}</p>}
      </div>
    </Modal>
  );
}
