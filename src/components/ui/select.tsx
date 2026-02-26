'use client';

/**
 * Select – Dropdown with options. DaisyUI select.
 * Location: src/components/ui/select.tsx
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  inputSize?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClass = { xs: 'select-xs', sm: 'select-sm', md: 'select-md', lg: 'select-lg' };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, options, placeholder, inputSize = 'md', className = '', ...props },
    ref
  ) => {
    return (
      <div className="form-control w-full">
        {label != null && (
          <label className="label" htmlFor={props.id}>
            <span className="label-text">{label}</span>
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'select select-bordered w-full',
            sizeClass[inputSize],
            error && 'select-error',
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder != null && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error != null && (
          <p className="label text-error text-sm mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
