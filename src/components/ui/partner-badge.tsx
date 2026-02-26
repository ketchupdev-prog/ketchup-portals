'use client';

/**
 * PartnerBadge – Brand badge with horizontal/vertical lockup.
 * Location: src/components/ui/partner-badge.tsx
 */

import { BrandBadge, type BrandBadgeTier } from './brand-badge';
import { cn } from '@/lib/utils';

export interface PartnerBadgeProps {
  tier: BrandBadgeTier;
  label?: string;
  lockup?: 'horizontal' | 'vertical';
  className?: string;
}

export function PartnerBadge({
  tier,
  label,
  lockup = 'horizontal',
  className = '',
}: PartnerBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        lockup === 'vertical' && 'flex-col',
        className
      )}
    >
      <BrandBadge tier={tier} label={label} />
      <span className="text-xs text-content-muted">Partner</span>
    </div>
  );
}
