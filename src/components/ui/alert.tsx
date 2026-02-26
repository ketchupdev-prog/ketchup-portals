'use client';

import { cn } from '@/lib/utils';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const variantClass: Record<AlertVariant, string> = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  return (
    <div role="alert" className={cn('alert', variantClass[variant], className)}>
      <div>
        {title != null && <h5 className="font-semibold">{title}</h5>}
        <span className="text-sm">{children}</span>
      </div>
    </div>
  );
}
