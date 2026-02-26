'use client';

import { cn } from '@/lib/utils';

const variantClass: Record<string, string> = {
  active: 'bg-success/20 text-success',
  inactive: 'bg-base-content/10 text-content-muted',
  pending: 'bg-warning/20 text-warning',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-error/20 text-error',
  success: 'bg-success/20 text-success',
  info: 'bg-info/20 text-info',
};

export type StatusPillVariant = 'active' | 'inactive' | 'pending' | 'warning' | 'error' | 'success' | 'info';

export interface StatusPillProps {
  variant?: StatusPillVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({ variant = 'active', children, className = '' }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
