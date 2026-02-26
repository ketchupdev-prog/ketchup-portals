'use client';

/**
 * Steps – Step indicator for wizards and multi-step flows.
 * Location: src/components/ui/steps.tsx
 */

import { cn } from '@/lib/utils';

export interface StepItem {
  label: string;
  description?: string;
}

export interface StepsProps {
  steps: StepItem[];
  currentStep: number;
  className?: string;
}

export function Steps({ steps, currentStep, className = '' }: StepsProps) {
  return (
    <ul className={cn('steps steps-vertical lg:steps-horizontal w-full', className)}>
      {steps.map((step, i) => (
        <li
          key={i}
          className={cn('step', i + 1 <= currentStep && 'step-primary')}
          data-content={i + 1 <= currentStep ? '✓' : undefined}
        >
          <span className="font-medium">{step.label}</span>
          {step.description != null && (
            <span className="block text-sm text-content-muted">{step.description}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
