'use client';

/**
 * Switch – Toggle switch. DaisyUI toggle.
 * Location: src/components/ui/switch.tsx
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="form-control">
        <label className={cn('label cursor-pointer justify-start gap-3', className)}>
          <input ref={ref} type="checkbox" className="toggle toggle-primary" {...props} />
          {label != null && <span className="label-text">{label}</span>}
        </label>
      </div>
    );
  }
);

Switch.displayName = 'Switch';
