'use client';

/**
 * BrandLogo – Full logo (horizontal, vertical, mark, wordmark). Use SVG/PNG assets.
 * Location: src/components/ui/brand-logo.tsx
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';

export type BrandLogoVariant = 'horizontal' | 'vertical' | 'mark' | 'wordmark';

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function BrandLogo({
  variant = 'horizontal',
  src = '/ketchup-logo.png',
  alt = 'Ketchup SmartPay',
  width = 120,
  height = 40,
  className = '',
}: BrandLogoProps) {
  if (src != null) {
    const isMark = variant === 'mark';
    const w = isMark ? Math.min(width, height) : width;
    const h = isMark ? Math.min(width, height) : height;
    return (
      <Image
        src={src}
        alt={alt}
        width={w}
        height={h}
        className={cn('object-contain', isMark && 'rounded-full', className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'font-bold text-primary',
        variant === 'mark' && 'text-2xl',
        variant === 'wordmark' && 'text-xl tracking-tight',
        variant === 'vertical' && 'flex flex-col items-center',
        className
      )}
    >
      {variant === 'mark' ? 'K' : 'Ketchup'}
    </span>
  );
}
