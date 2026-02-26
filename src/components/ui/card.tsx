'use client';

/**
 * Card – Container with DaisyUI styling; subcomponents CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
 * Purpose: Content grouping and layout (beneficiary cards, dashboards, forms). Rule 1, 22.
 * Location: src/components/ui/card.tsx
 * Props: variant (default, elevated, outline, ghost), hover (transition on hover).
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva('rounded-xl border border-base-300 shadow-sm', {
  variants: {
    variant: {
      default: 'bg-base-100',
      elevated: 'bg-base-100 shadow-lg',
      outline: 'bg-transparent border-2',
      ghost: 'bg-base-100/50 border-base-300/50',
    },
    hover: {
      true: 'hover:shadow-md transition-shadow',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    hover: false,
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant, hover, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, className }))}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pt-6', className)} {...props} />;
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-base-content', className)} {...props} />;
}

export function CardDescription({
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-content-muted mt-1', className)} {...props} />;
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4', className)} {...props} />;
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pb-6 flex items-center gap-2', className)} {...props} />;
}
