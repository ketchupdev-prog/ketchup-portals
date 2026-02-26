'use client';

/**
 * Container – Max-width centered layout wrapper.
 * Location: src/components/ui/container.tsx
 */

import { cn } from '@/lib/utils';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'full';

const sizeClass: Record<ContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  full: 'max-w-full',
};

export interface ContainerProps {
  size?: ContainerSize;
  children: React.ReactNode;
  className?: string;
}

export function Container({ size = 'lg', children, className = '' }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClass[size], className)}>
      {children}
    </div>
  );
}
