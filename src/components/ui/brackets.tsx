'use client';

/**
 * Brackets – Content-framing brackets (e.g. around photos or stats).
 * Location: src/components/ui/brackets.tsx
 */

import { cn } from '@/lib/utils';

export interface BracketsProps {
  children: React.ReactNode;
  className?: string;
}

export function Brackets({ children, className = '' }: BracketsProps) {
  return (
    <div className={cn('relative pl-6 pr-6', className)}>
      <span className="absolute left-0 top-0 bottom-0 text-2xl font-serif text-primary/40" aria-hidden>[</span>
      <span className="absolute right-0 top-0 bottom-0 text-2xl font-serif text-primary/40" aria-hidden>]</span>
      {children}
    </div>
  );
}
