'use client';

import { Button, type ButtonProps } from './button';
import { cn } from '@/lib/utils';

export interface PillButtonProps extends Omit<ButtonProps, 'shape'> {
  active?: boolean;
}

export function PillButton({ active, className, ...props }: PillButtonProps) {
  return (
    <Button
      shape="pill"
      className={cn(active && 'btn-active', className)}
      {...props}
    />
  );
}

export interface PillGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function PillGroup({ children, className = '' }: PillGroupProps) {
  return <div className={cn('join', className)} role="group" aria-label="Pill group">{children}</div>;
}
