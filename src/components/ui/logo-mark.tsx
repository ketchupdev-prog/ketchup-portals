'use client';

/**
 * LogoMark – Isolated circular logo mark (favicon, app icon).
 * Location: src/components/ui/logo-mark.tsx
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface LogoMarkProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}

export function LogoMark({ src, alt = 'Ketchup', size = 32, className = '' }: LogoMarkProps) {
  if (src != null) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-sm',
        className
      )}
      style={{ width: size, height: size }}
    >
      K
    </div>
  );
}
