'use client';

/**
 * OpenFrame – Branded frame element to focus attention.
 * Location: src/components/ui/open-frame.tsx
 */

import { cn } from '@/lib/utils';

export interface OpenFrameProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'outline';
  className?: string;
}

export function OpenFrame({
  children,
  variant = 'default',
  className = '',
}: OpenFrameProps) {
  const variantClass =
    variant === 'primary'
      ? 'border-2 border-primary rounded-xl p-4'
      : variant === 'outline'
        ? 'border-2 border-base-300 rounded-xl p-4'
        : 'border border-base-300 rounded-lg p-4';
  return (
    <div className={cn(variantClass, className)} data-open-frame>
      {children}
    </div>
  );
}
