'use client';

/**
 * Divider – Horizontal or vertical separator.
 * Location: src/components/ui/divider.tsx
 */

import { cn } from '@/lib/utils';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export function Divider({ orientation = 'horizontal', label, className = '' }: DividerProps) {
  if (label != null && orientation === 'horizontal') {
    return (
      <div className={cn('divider', className)} role="separator">
        {label}
      </div>
    );
  }
  if (orientation === 'vertical') {
    return <div className={cn('divider divider-horizontal', className)} role="separator" />;
  }
  return <div className={cn('divider', className)} role="separator" />;
}
