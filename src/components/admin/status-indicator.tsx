'use client';

import { cn } from '@/lib/utils';

export type StatusLevel = 'good' | 'warning' | 'critical' | 'unknown';

interface StatusIndicatorProps {
  status: StatusLevel;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<StatusLevel, { badge: string; color: string }> = {
  good: { badge: 'badge-success', color: 'bg-success' },
  warning: { badge: 'badge-warning', color: 'bg-warning' },
  critical: { badge: 'badge-error', color: 'bg-error' },
  unknown: { badge: 'badge-ghost', color: 'bg-base-300' },
};

const statusLabels: Record<StatusLevel, string> = {
  good: 'GOOD',
  warning: 'WARNING',
  critical: 'CRITICAL',
  unknown: 'UNKNOWN',
};

const sizeClasses = {
  sm: 'badge-sm',
  md: 'badge-md',
  lg: 'badge-lg',
};

export function StatusIndicator({ status, label, showDot = true, size = 'md', className }: StatusIndicatorProps) {
  const { badge, color } = statusConfig[status];
  const displayLabel = label ?? statusLabels[status];

  return (
    <span className={cn('badge', badge, sizeClasses[size], className)}>
      {showDot && <span className={cn('inline-block w-2 h-2 rounded-full mr-1', color)} />}
      {displayLabel}
    </span>
  );
}
