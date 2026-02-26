'use client';

/**
 * Settings – Shared route when user opens Settings from outside a portal.
 * Calls GET /api/v1/portal/me; if 401 redirects to /login?redirect=/settings; else redirects by role to portal settings.
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPortalFromPath, getPortalLoginPath } from '@/lib/portal-auth-config';

const ROLE_TO_SETTINGS: Record<string, string> = {
  agent: '/agent/settings',
  ketchup_ops: '/ketchup/settings',
  ketchup_compliance: '/ketchup/settings',
  ketchup_finance: '/ketchup/settings',
  ketchup_support: '/ketchup/settings',
  gov_manager: '/government/settings',
  gov_auditor: '/government/settings',
  field_tech: '/field-ops/settings',
  field_lead: '/field-ops/settings',
};

function SettingsRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/portal/me', { credentials: 'include' })
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 401) {
          const redirect = searchParams.get('redirect') ?? '/settings';
          const portal = getPortalFromPath(redirect) ?? 'agent';
          router.replace(getPortalLoginPath(portal, redirect));
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        const path = ROLE_TO_SETTINGS[data.role] ?? '/agent/settings';
        router.replace(path);
      })
      .catch(() => {
        if (!cancelled) router.replace(getPortalLoginPath('agent', '/settings'));
      });
    return () => { cancelled = true; };
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-content-muted">Redirecting to settings…</p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><p className="text-content-muted">Loading…</p></div>}>
      <SettingsRedirectInner />
    </Suspense>
  );
}
