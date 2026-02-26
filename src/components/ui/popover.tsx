'use client';

/**
 * Popover – Floating panel for additional info/actions. Uses DaisyUI dropdown.
 * Location: src/components/ui/popover.tsx
 */

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'end';
  className?: string;
}

const positionClass = {
  top: 'dropdown-top',
  bottom: 'dropdown-bottom',
  left: 'dropdown-left',
  right: 'dropdown-right',
  end: 'dropdown-end',
};

export function Popover({ trigger, children, position = 'bottom', className = '' }: PopoverProps) {
  return (
    <div className={cn('dropdown', positionClass[position], className)}>
      <label tabIndex={0} className="cursor-pointer">
        {trigger}
      </label>
      <div
        tabIndex={0}
        className={cn(
          'dropdown-content z-50 p-4 shadow-lg bg-base-100 rounded-box border border-base-300 min-w-48'
        )}
      >
        {children}
      </div>
    </div>
  );
}
