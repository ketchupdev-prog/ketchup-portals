'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="form-control">
      <label className={cn('label cursor-pointer justify-start gap-3', className)}>
        <input ref={ref} type="checkbox" className="checkbox checkbox-primary" {...props} />
        {label != null && <span className="label-text">{label}</span>}
      </label>
      {error != null && <p className="text-error text-sm mt-0.5">{error}</p>}
    </div>
  )
);

Checkbox.displayName = 'Checkbox';
