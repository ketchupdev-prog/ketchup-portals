'use client';

/**
 * FormField – Wrapper for form field with label, hint, and error (Rule 1, 3).
 * Purpose: Consistent form layout; works with or without React Hook Form.
 * Location: src/components/ui/form-field.tsx
 * Props: label, error, hint, required, htmlFor, children, className.
 */

import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={cn('form-control w-full', className)}>
      {label != null && (
        <label className="label py-0.5" htmlFor={htmlFor}>
          <span className="label-text">
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </span>
        </label>
      )}
      {children}
      {hint != null && !error && (
        <p className="text-sm text-content-muted mt-0.5">{hint}</p>
      )}
      {error != null && (
        <p className="label text-error text-sm mt-0.5 py-0">{error}</p>
      )}
    </div>
  );
}
