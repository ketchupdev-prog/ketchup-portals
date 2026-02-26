'use client';

import { cn } from '@/lib/utils';

const variantClass: Record<string, string> = {
  active: 'badge badge-success gap-1',
  inactive: 'badge badge-ghost gap-1',
  pending: 'badge badge-warning gap-1',
  warning: 'badge badge-warning gap-1',
  error: 'badge badge-error gap-1',
  success: 'badge badge-success gap-1',
  info: 'badge badge-info gap-1',
};

const sizeClass: Record<string, string> = {
  sm: 'badge-sm',
  md: 'badge-md',
  lg: 'badge-lg',
};

const dotClass: Record<string, string> = {
  active: 'bg-success',
  success: 'bg-success',
  inactive: 'bg-base-content/50',
  pending: 'bg-warning',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
};

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'warning'
  | 'error'
  | 'success'
  | 'info';
export type StatusSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps {
  variant?: StatusVariant;
  size?: StatusSize;
  showDot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({
  variant = 'active',
  size = 'md',
  showDot = true,
  children,
  className = '',
}: StatusBadgeProps) {
  const dot = dotClass[variant] ?? 'bg-base-content/50';
  return (
    <span className={cn(variantClass[variant], sizeClass[size], className)}>
      {showDot && <span className={cn('w-2 h-2 rounded-full', dot)} />}
      {children}
    </span>
  );
}
