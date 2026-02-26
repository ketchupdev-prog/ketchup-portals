'use client';

/**
 * BrandArrow – Directional arrow for flow/movement.
 * Location: src/components/ui/brand-arrow.tsx
 */

import { cn } from '@/lib/utils';

export type BrandArrowDirection = 'left' | 'right' | 'up' | 'down';

const directionClass: Record<BrandArrowDirection, string> = {
  left: 'rotate-180',
  right: '',
  up: '-rotate-90',
  down: 'rotate-90',
};

export interface BrandArrowProps {
  direction?: BrandArrowDirection;
  className?: string;
}

export function BrandArrow({ direction = 'right', className = '' }: BrandArrowProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-5 h-5 text-primary', directionClass[direction], className)}
      aria-hidden
    >
      <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  );
}
