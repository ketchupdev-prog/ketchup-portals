'use client';

import { cn } from '@/lib/utils';

interface MetricGaugeProps {
  value: number;
  max?: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  showPercentage?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-24 h-24',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
};

const colorClasses = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
};

export function MetricGauge({
  value,
  max = 100,
  label,
  size = 'md',
  color = 'primary',
  showPercentage = true,
  className,
}: MetricGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const displayValue = showPercentage ? `${percentage.toFixed(1)}%` : value;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('radial-progress', colorClasses[color], sizeClasses[size])} style={{ '--value': percentage } as React.CSSProperties}>
        <span className="text-lg font-bold">{displayValue}</span>
      </div>
      <p className="text-sm text-center text-content-muted">{label}</p>
    </div>
  );
}
