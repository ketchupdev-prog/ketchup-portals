'use client';

/**
 * RadioGroup – Radio button group. DaisyUI form + radio.
 * Location: src/components/ui/radio-group.tsx
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
}

export interface RadioGroupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  name: string;
  options: RadioOption[];
  label?: string;
  error?: string;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  (
    { name, options, label, error, layout = 'vertical', className = '', value, onChange, ...props },
    ref
  ) => {
    return (
      <div className={cn('form-control', className)} role="radiogroup" aria-label={label}>
        {label != null && (
          <span className="label-text mb-1 block" id={`${name}-label`}>
            {label}
          </span>
        )}
        <div className={cn('flex gap-4', layout === 'vertical' && 'flex-col')}>
          {options.map((opt) => (
            <label key={opt.value} className="label cursor-pointer justify-start gap-2">
              <input
                ref={ref}
                type="radio"
                name={name}
                value={opt.value}
                className="radio radio-primary"
                checked={value === opt.value}
                onChange={onChange}
                aria-labelledby={`${name}-label`}
                {...props}
              />
              <span className="label-text">{opt.label}</span>
            </label>
          ))}
        </div>
        {error != null && <p className="text-error text-sm mt-0.5">{error}</p>}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
