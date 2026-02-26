'use client';

/**
 * PortalLayoutOrAuthShell – Renders PortalLayout for app routes or auth shell (footer only) for login/forgot/register.
 * Enables per-portal auth URLs (e.g. /ketchup/login) without sidebar. Used by each portal's layout.
 * Location: src/components/portal-layout/PortalLayoutOrAuthShell.tsx
 */

import { usePathname } from 'next/navigation';
import { PortalLayout } from '@/components/portal-layout';
import { LandingFooter } from '@/components/landing';
import type { PortalSlug } from '@/lib/portal-auth-config';

const AUTH_SEGMENTS = ['login', 'forgot-password', 'register'];

function isPortalAuthPath(pathname: string, portal: PortalSlug): boolean {
  const prefix = `/${portal}/`;
  if (!pathname.startsWith(prefix)) return false;
  const rest = pathname.slice(prefix.length);
  const first = rest.split('/')[0];
  return AUTH_SEGMENTS.includes(first);
}

export interface PortalLayoutOrAuthShellProps {
  portal: PortalSlug;
  children: React.ReactNode;
}

export function PortalLayoutOrAuthShell({ portal, children }: PortalLayoutOrAuthShellProps) {
  const pathname = usePathname() ?? '';

  if (isPortalAuthPath(pathname, portal)) {
    return (
      <div className="min-h-screen flex flex-col bg-base-100">
        <main className="flex-1 flex flex-col">{children}</main>
        <LandingFooter />
      </div>
    );
  }

  return <PortalLayout>{children}</PortalLayout>;
}
