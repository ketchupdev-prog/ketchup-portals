'use client';

import { cn } from '@/lib/utils';

export type StatsVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  variant?: StatsVariant;
  subtitle?: string;
  badge?: React.ReactNode;
  className?: string;
}

const borderClass: Record<StatsVariant, string> = {
  default: 'border-l-4 border-base-300',
  primary: 'border-l-4 border-primary',
  success: 'border-l-4 border-success',
  warning: 'border-l-4 border-warning',
  error: 'border-l-4 border-error',
  info: 'border-l-4 border-info',
};

export function StatsCard({
  title,
  value,
  change,
  icon,
  variant = 'default',
  subtitle,
  badge,
  className,
}: StatsCardProps) {
  return (
    <div className={cn('card bg-base-200', borderClass[variant], className)}>
      <div className="card-body">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-content-muted">{title}</p>
            <p className="text-3xl font-bold mt-1 text-base-content">{value}</p>
            {subtitle && <p className="text-xs text-content-muted mt-1">{subtitle}</p>}
            {change && <p className="text-xs text-content-muted mt-1">{change}</p>}
            {badge && <div className="mt-2">{badge}</div>}
          </div>
          {icon && <div className="text-content-muted opacity-50">{icon}</div>}
        </div>
      </div>
    </div>
  );
}
