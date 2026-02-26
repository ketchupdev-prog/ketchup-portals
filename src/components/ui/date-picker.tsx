'use client';

/**
 * DatePicker – Date selection using native input or simple wrapper.
 * Location: src/components/ui/date-picker.tsx
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  inputSize?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClass = { xs: 'input-xs', sm: 'input-sm', md: 'input-md', lg: 'input-lg' };

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, inputSize = 'md', className = '', ...props }, ref) => (
    <div className="form-control w-full">
      {label != null && (
        <label className="label" htmlFor={props.id}>
          <span className="label-text">{label}</span>
        </label>
      )}
      <input
        ref={ref}
        type="date"
        className={cn('input input-bordered w-full', sizeClass[inputSize], error && 'input-error', className)}
        aria-invalid={!!error}
        {...props}
      />
      {error != null && <p className="label text-error text-sm mt-0.5">{error}</p>}
    </div>
  )
);

DatePicker.displayName = 'DatePicker';
