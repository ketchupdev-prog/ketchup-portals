'use client';

/**
 * PortalLogo – Logo with portal-specific label (e.g. Ketchup Portal).
 * Location: src/components/ui/portal-logo.tsx
 */

import { BrandLogo } from './brand-logo';
import { cn } from '@/lib/utils';

export interface PortalLogoProps {
  portalLabel?: string;
  logoVariant?: 'horizontal' | 'vertical' | 'mark' | 'wordmark';
  className?: string;
}

export function PortalLogo({
  portalLabel = 'Portal',
  logoVariant = 'horizontal',
  className = '',
}: PortalLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <BrandLogo variant={logoVariant} />
      <span className="text-sm font-medium text-content-muted">{portalLabel}</span>
    </div>
  );
}
