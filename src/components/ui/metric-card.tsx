'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const borderClass: Record<string, string> = {
  default: 'border-l-4 border-base-300',
  primary: 'border-l-4 border-primary',
  accent: 'border-l-4 border-secondary',
  ketchup: 'border-l-4 border-[#226644]',
  success: 'border-l-4 border-success',
  warning: 'border-l-4 border-warning',
};

export type MetricVariant = 'default' | 'primary' | 'accent' | 'ketchup' | 'success' | 'warning';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  variant?: MetricVariant;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  variant = 'default',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(borderClass[variant], 'overflow-hidden', className)}>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-content-muted">{title}</p>
          <p className="text-2xl font-bold mt-1 text-base-content">{value}</p>
          {change != null && <p className="text-xs mt-1 text-content-muted">{change}</p>}
        </div>
        {icon != null && <div className="text-content-muted">{icon}</div>}
      </CardContent>
    </Card>
  );
}
