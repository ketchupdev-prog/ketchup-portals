'use client';

/**
 * BlurOverlay – Blurred background overlay for hero sections.
 * Location: src/components/ui/blur-overlay.tsx
 */

import { cn } from '@/lib/utils';

export interface BlurOverlayProps {
  children?: React.ReactNode;
  blur?: 'sm' | 'md' | 'lg';
  className?: string;
}

const blurClass = { sm: 'backdrop-blur-sm', md: 'backdrop-blur-md', lg: 'backdrop-blur-lg' };

export function BlurOverlay({
  children,
  blur = 'md',
  className = '',
}: BlurOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-base-100/70',
        blurClass[blur],
        className
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}
