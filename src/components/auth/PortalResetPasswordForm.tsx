'use client';

/**
 * PortalResetPasswordForm – Shared reset-password form with portal-specific copy.
 * Used by /[portal]/reset-password. Validates token, allows setting new password.
 * Location: src/components/auth/PortalResetPasswordForm.tsx
 */

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthHero } from '@/components/landing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IOSButton } from '@/components/ui/ios-button';
import { type PortalSlug, PORTAL_AUTH, getPortalLoginPath } from '@/lib/portal-auth-config';

export interface PortalResetPasswordFormProps {
  portal: PortalSlug;
}

export function PortalResetPasswordForm({ portal }: PortalResetPasswordFormProps) {
  return (
    <Suspense fallback={<div className="card bg-base-100 shadow-xl w-full max-w-md"><div className="card-body"><p className="text-content-muted">Loading…</p></div></div>}>
      <PortalResetPasswordFormInner portal={portal} />
    </Suspense>
  );
}

function PortalResetPasswordFormInner({ portal }: PortalResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const config = PORTAL_AUTH[portal];
  const token = searchParams.get('token') ?? '';
  
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      setError('No reset token provided');
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/v1/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        
        if (res.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError('This password reset link is invalid or has expired');
        }
      } catch {
        setTokenValid(false);
        setError('Failed to validate reset link');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/confirm-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(getPortalLoginPath(portal));
        }, 2000);
      } else {
        setError(data.message ?? data.errors?.[0]?.message ?? 'Failed to reset password');
      }
    } catch {
      setError('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginPath = getPortalLoginPath(portal);

  return (
    <>
      <AuthHero title="Reset Password" subline={`${config.label} — Set your new password`} />
      <section className="flex flex-col items-center justify-center px-4 py-10 sm:py-14 bg-base-200/50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            {validating ? (
              <div className="space-y-4">
                <p className="text-base-content/80">Validating reset link...</p>
              </div>
            ) : !tokenValid ? (
              <div className="space-y-4">
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
                <p className="text-sm text-base-content/70">
                  This link may have expired or been used already. Password reset links expire after 24 hours.
                </p>
                <div className="card-actions flex flex-wrap gap-2 pt-2">
                  <Link href={`/${portal}/forgot-password`} className="link link-primary text-sm">
                    Request new reset link
                  </Link>
                  <span className="text-base-content/50">|</span>
                  <Link href={loginPath} className="link link-primary text-sm">
                    Back to sign in
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="space-y-4">
                <div className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Password reset successful!</span>
                </div>
                <p className="text-base-content/80">
                  Redirecting you to sign in...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form-control gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <label className="label">
                    <span className="label-text-alt">Minimum 8 characters</span>
                  </label>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Confirm Password</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="card-actions justify-end mt-2">
                  <IOSButton type="submit" variant="primary" disabled={loading} className="w-full">
                    {loading ? 'Resetting password…' : 'Reset Password'}
                  </IOSButton>
                </div>

                <p className="text-sm text-base-content/70 mt-2 text-center">
                  <Link href={loginPath} className="link link-primary">
                    ← Back to sign in
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
