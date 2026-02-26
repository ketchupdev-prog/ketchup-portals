'use client';

/**
 * Global forgot-password – Redirects to portal-specific forgot (e.g. /agent/forgot-password) when redirect param points to a portal.
 * Default: show Agent forgot form. Location: src/app/(auth)/forgot-password/page.tsx
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PortalForgotForm } from '@/components/auth';
import { getPortalFromPath, PORTAL_AUTH } from '@/lib/portal-auth-config';

function ForgotRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('returnTo') ?? searchParams.get('redirect') ?? PORTAL_AUTH.agent.defaultRedirect;
  const portal = getPortalFromPath(redirect) ?? 'agent';
  const portalForgotUrl = `/${portal}/forgot-password?returnTo=${encodeURIComponent(redirect)}`;

  useEffect(() => {
    if (portal !== 'agent') {
      router.replace(portalForgotUrl);
    }
  }, [portal, portalForgotUrl, router]);

  if (portal !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <p className="text-base-content/70">Redirecting to {PORTAL_AUTH[portal].label} password reset…</p>
      </div>
    );
  }

  return <PortalForgotForm portal="agent" />;
}

export default function GlobalForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><span className="loading loading-spinner text-primary" /></div>}>
      <ForgotRedirectInner />
    </Suspense>
  );
}
