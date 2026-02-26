'use client';

/**
 * HeroBlur – Hero section with blurred background.
 * Location: src/components/ui/hero-blur.tsx
 */

import { BlurOverlay } from './blur-overlay';
import { cn } from '@/lib/utils';

export interface HeroBlurProps {
  children: React.ReactNode;
  backgroundSrc?: string;
  blur?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HeroBlur({
  children,
  backgroundSrc,
  blur = 'md',
  className = '',
}: HeroBlurProps) {
  return (
    <section
      className={cn('relative min-h-[200px] flex items-center justify-center overflow-hidden rounded-xl', className)}
      style={backgroundSrc ? { backgroundImage: `url(${backgroundSrc})`, backgroundSize: 'cover' } : undefined}
    >
      <BlurOverlay blur={blur} />
      <div className="relative z-10 p-8 text-center">{children}</div>
    </section>
  );
}
