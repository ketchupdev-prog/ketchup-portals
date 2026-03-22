'use client';

/**
 * PortalForgotForm – Shared forgot-password form with portal-specific copy.
 * Used by /forgot-password (global) and /[portal]/forgot-password (per-portal). COMPONENT_INVENTORY §10 Auth.
 * Location: src/components/auth/PortalForgotForm.tsx
 */

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthHero } from '@/components/landing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IOSButton } from '@/components/ui/ios-button';
import { type PortalSlug, PORTAL_AUTH } from '@/lib/portal-auth-config';

export interface PortalForgotFormProps {
  portal: PortalSlug;
}

function PortalForgotFormInner({ portal }: PortalForgotFormProps) {
  const config = PORTAL_AUTH[portal];
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? searchParams.get('redirect') ?? config.defaultRedirect;
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? data.error ?? 'Something went wrong. Try again or contact support.');
      }
    } catch {
      setError('Request failed. Try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = `/${portal}/login${returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : ''}`;

  return (
    <>
      <AuthHero title={config.forgotTitle} subline={config.forgotSubline} />
      <section className="flex flex-col items-center justify-center px-4 py-10 sm:py-14 bg-base-200/50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Forgot password?</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <p className="text-base-content/80">
                  If an account exists for <strong>{email}</strong>, we’ve sent a reset link. Check your inbox and spam folder.
                </p>
                <p className="text-sm text-base-content/70">
                  The link will expire in 24 hours. If you don't receive the email within a few minutes, please check your spam folder.
                </p>
                <div className="card-actions flex flex-wrap gap-2 pt-2">
                  <Link href={backToLogin} className="link link-primary text-sm">
                    ← Back to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form-control gap-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                {error && <p className="text-sm text-error">{error}</p>}
                <div className="card-actions justify-between mt-2">
                  <Link href={backToLogin} className="link link-primary text-sm">
                    ← Back to sign in
                  </Link>
                  <IOSButton type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Sending…' : 'Send reset link'}
                  </IOSButton>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

/** Wraps inner form so `useSearchParams` satisfies Next.js static generation (Suspense boundary). */
export function PortalForgotForm(props: PortalForgotFormProps) {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-[40vh] items-center justify-center px-4 py-10">
          <span className="loading loading-spinner loading-lg text-primary" aria-label="Loading" />
        </section>
      }
    >
      <PortalForgotFormInner {...props} />
    </Suspense>
  );
}
