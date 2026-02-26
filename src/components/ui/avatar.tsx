'use client';

/**
 * Avatar – User/agent/beneficiary avatar with image or initials.
 * Location: src/components/ui/avatar.tsx
 */

import { cn } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeClass: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
};

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  className?: string;
  ring?: boolean;
  placeholder?: boolean;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({
  src,
  alt = '',
  initials: initialsProp,
  size = 'md',
  className = '',
  ring = false,
  placeholder = false,
}: AvatarProps) {
  const initials = initialsProp ?? (alt ? getInitials(alt) : '?');
  const sizeCls = sizeClass[size];

  return (
    <div
      className={cn(
        'avatar',
        placeholder && 'placeholder',
        ring && 'ring ring-primary ring-offset-base-100 ring-offset-2',
        className
      )}
    >
      <div className={cn('rounded-full bg-base-300 text-base-content overflow-hidden', sizeCls)}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="flex items-center justify-center w-full h-full font-medium">{initials}</span>
        )}
      </div>
    </div>
  );
}
