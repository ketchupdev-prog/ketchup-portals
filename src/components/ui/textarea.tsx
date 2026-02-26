'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="form-control w-full">
      {label != null && (
        <label className="label" htmlFor={props.id}>
          <span className="label-text">{label}</span>
        </label>
      )}
      <textarea ref={ref} className={cn('textarea textarea-bordered w-full', error && 'textarea-error', className)} aria-invalid={!!error} {...props} />
      {error != null && <p className="label text-error text-sm mt-0.5">{error}</p>}
    </div>
  )
);

Textarea.displayName = 'Textarea';
