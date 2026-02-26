'use client';

import { cn } from '@/lib/utils';

const variantClass: Record<string, string> = {
  default: 'badge',
  secondary: 'badge badge-secondary',
  destructive: 'badge badge-error',
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  info: 'badge badge-info',
  outline: 'badge badge-outline',
  ghost: 'badge badge-ghost',
  ketchup: 'badge bg-[#226644] text-white border-0',
};

const sizeClass: Record<string, string> = {
  sm: 'badge-sm',
  md: 'badge-md',
  lg: 'badge-lg',
};

export type BadgeVariant = keyof typeof variantClass;
export type BadgeSize = keyof typeof sizeClass;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({ variant = 'default', size = 'md', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  );
}
