'use client';

/**
 * Global login – Redirects to portal-specific login (e.g. /agent/login, /ketchup/login) for DNS-friendly URLs.
 * Infer portal from ?redirect=; default agent. Renders Agent login while redirecting if needed.
 * Location: src/app/(auth)/login/page.tsx
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PortalLoginForm } from '@/components/auth';
import { getPortalFromPath, getPortalLoginPath, PORTAL_AUTH } from '@/lib/portal-auth-config';

function LoginRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? PORTAL_AUTH.agent.defaultRedirect;
  const portal = getPortalFromPath(redirect) ?? 'agent';
  const portalLoginUrl = getPortalLoginPath(portal, redirect);

  useEffect(() => {
    if (portal !== 'agent') {
      router.replace(portalLoginUrl);
    }
  }, [portal, portalLoginUrl, router]);

  if (portal !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <p className="text-base-content/70">Redirecting to {PORTAL_AUTH[portal].label} sign in…</p>
      </div>
    );
  }

  return <PortalLoginForm portal="agent" />;
}

export default function GlobalLoginPage() {
  return (
    <Suspense fallback={<div className="card bg-base-100 shadow-xl w-full max-w-md"><div className="card-body"><p className="text-content-muted">Loading…</p></div></div>}>
      <LoginRedirectInner />
    </Suspense>
  );
}
