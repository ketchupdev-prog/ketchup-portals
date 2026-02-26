'use client';

/**
 * PortalLoginForm – Shared sign-in form with portal-specific copy and redirect.
 * Used by /login (global) and /[portal]/login (per-portal). COMPONENT_INVENTORY §10 Auth.
 * Location: src/components/auth/PortalLoginForm.tsx
 */

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthHero } from '@/components/landing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IOSButton } from '@/components/ui/ios-button';
import { type PortalSlug, PORTAL_AUTH, getPortalForgotPasswordPath } from '@/lib/portal-auth-config';

export interface PortalLoginFormProps {
  portal: PortalSlug;
}

export function PortalLoginForm({ portal }: PortalLoginFormProps) {
  return (
    <Suspense fallback={<div className="card bg-base-100 shadow-xl w-full max-w-md"><div className="card-body"><p className="text-content-muted">Loading…</p></div></div>}>
      <PortalLoginFormInner portal={portal} />
    </Suspense>
  );
}

function PortalLoginFormInner({ portal }: PortalLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const config = PORTAL_AUTH[portal];
  const redirect = searchParams.get('redirect') ?? config.defaultRedirect;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Sign in failed');
        return;
      }
      router.push(redirect);
    } catch {
      setError('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const forgotHref = getPortalForgotPasswordPath(portal, redirect);
  const registerPath = `/${portal}/register`;
  const registerHref = redirect ? `${registerPath}?redirect=${encodeURIComponent(redirect)}` : registerPath;

  return (
    <>
      <AuthHero title={config.loginTitle} subline={config.loginSubline} />
      <section className="flex flex-col items-center justify-center px-4 py-10 sm:py-14 bg-base-200/50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="form-control gap-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {error && <p className="text-sm text-error">{error}</p>}
              <div className="card-actions justify-between mt-2">
                <Link href={forgotHref} className="link link-primary text-sm">
                  Forgot password?
                </Link>
                <IOSButton type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </IOSButton>
              </div>
              <p className="text-sm text-base-content/70 mt-2">
                Don&apos;t have an account?{' '}
                <Link href={registerHref} className="link link-primary">
                  Create account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
