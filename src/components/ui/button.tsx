'use client';

/**
 * Button – Reusable DaisyUI-styled button with variants, sizes, loading state.
 * Purpose: Primary CTA and secondary actions across Ketchup portals (Rule 1).
 * Location: src/components/ui/button.tsx
 * Props: variant (primary, secondary, outline, ghost, danger, success, link, ketchup),
 *        size (xs–xl), shape (square, circle, pill), fullWidth, loading.
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: '',
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      danger: 'btn-error',
      success: 'btn-success',
      link: 'btn-link',
      ketchup: 'bg-[#226644] hover:bg-[#1a4d33] text-white border-0',
    },
    size: {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
      xl: 'btn-xl',
    },
    shape: {
      default: '',
      square: 'btn-square',
      circle: 'btn-circle',
      pill: 'rounded-full',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    shape: 'default',
    fullWidth: false,
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, shape, fullWidth, loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(buttonVariants({ variant, size, shape, fullWidth, className }))}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = 'Button';
