'use client';

import { cn } from '@/lib/utils';

export type FabPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const positionClass: Record<FabPosition, string> = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

export interface FabProps {
  children: React.ReactNode;
  position?: FabPosition;
  className?: string;
}

export function FAB({ children, position = 'bottom-right', className = '' }: FabProps) {
  return (
    <div
      className={cn('fixed z-40', positionClass[position], className)}
      role="group"
      aria-label="Floating action button"
    >
      {children}
    </div>
  );
}
