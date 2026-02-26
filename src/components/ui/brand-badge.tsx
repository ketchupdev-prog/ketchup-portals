'use client';

/**
 * BrandBadge – Silver/Gold/Platinum partner badges.
 * Location: src/components/ui/brand-badge.tsx
 */

import { cn } from '@/lib/utils';

export type BrandBadgeTier = 'silver' | 'gold' | 'platinum';

const tierClass: Record<BrandBadgeTier, string> = {
  silver: 'bg-base-300 text-base-content',
  gold: 'bg-warning/20 text-warning border-warning/40',
  platinum: 'bg-primary/20 text-primary border-primary/40',
};

export interface BrandBadgeProps {
  tier: BrandBadgeTier;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = { sm: 'badge-sm', md: 'badge-md', lg: 'badge-lg' };

export function BrandBadge({
  tier,
  label,
  size = 'md',
  className = '',
}: BrandBadgeProps) {
  const text = label ?? tier.charAt(0).toUpperCase() + tier.slice(1);
  return (
    <span
      className={cn(
        'badge border font-medium',
        tierClass[tier],
        sizeClass[size],
        className
      )}
    >
      {text}
    </span>
  );
}
