'use client';

/**
 * Progress – Linear progress bar. Used for loading, steps, completion.
 * Location: src/components/ui/progress.tsx
 */

import { cn } from '@/lib/utils';

export type ProgressVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

const variantClass: Record<ProgressVariant, string> = {
  primary: 'progress-primary',
  secondary: 'progress-secondary',
  success: 'progress-success',
  warning: 'progress-warning',
  error: 'progress-error',
};

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  className?: string;
}

export function Progress({ value, max = 100, variant = 'primary', className = '' }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <progress
      className={cn('progress', variantClass[variant], className)}
      value={value}
      max={max}
    >
      {pct}%
    </progress>
  );
}
