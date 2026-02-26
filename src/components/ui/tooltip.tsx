'use client';

/**
 * Tooltip – Simple tooltip using DaisyUI tooltip.
 * Location: src/components/ui/tooltip.tsx
 */

import { cn } from '@/lib/utils';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

const positionClass: Record<TooltipPosition, string> = {
  top: 'tooltip-top',
  bottom: 'tooltip-bottom',
  left: 'tooltip-left',
  right: 'tooltip-right',
};

export interface TooltipProps {
  content: string;
  position?: TooltipPosition;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, position = 'top', children, className = '' }: TooltipProps) {
  return (
    <div
      className={cn('tooltip', positionClass[position], className)}
      data-tip={content}
    >
      {children}
    </div>
  );
}
