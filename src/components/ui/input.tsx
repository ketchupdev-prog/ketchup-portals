'use client';

/**
 * Input – DaisyUI-styled text input with optional label, error, left/right icons (Rule 1, 3).
 * Purpose: Forms (login, beneficiary, float request); consistent with sign-in styles (Rule 20).
 * Location: src/components/ui/input.tsx
 * Props: label, error, leftIcon, rightIcon, inputSize (xs|sm|md|lg), plus native input attrs.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClass = { xs: 'input-xs', sm: 'input-sm', md: 'input-md', lg: 'input-lg' };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, inputSize = 'md', className = '', ...props }, ref) => (
    <div className="form-control w-full">
      {label != null && (
        <label className="label" htmlFor={props.id}>
          <span className="label-text">{label}</span>
        </label>
      )}
      <div className="relative">
        {leftIcon != null && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">{leftIcon}</span>}
        <input
          ref={ref}
          className={cn('input input-bordered w-full', sizeClass[inputSize], leftIcon && 'pl-10', rightIcon && 'pr-10', error && 'input-error', className)}
          aria-invalid={!!error}
          {...props}
        />
        {rightIcon != null && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted">{rightIcon}</span>}
      </div>
      {error != null && <p className="label text-error text-sm mt-0.5">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
