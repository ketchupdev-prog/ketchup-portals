'use client';

/**
 * Two-Factor Authentication Login Challenge
 * Location: src/app/login/2fa-challenge/page.tsx
 * 
 * Purpose: Verify 2FA token after successful password verification
 * Shown when user logs in and has 2FA enabled
 * 
 * Features:
 * - Enter 6-digit TOTP code
 * - Use backup code option
 * - Rate limited (5 attempts per minute)
 * - Redirects to dashboard on success
 * 
 * Security:
 * - Requires userId from login flow (stored in sessionStorage)
 * - Creates session only after successful 2FA verification
 */

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function TwoFactorChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Get userId from query params or sessionStorage
    const userIdParam = searchParams.get('userId');
    const storedUserId = sessionStorage.getItem('2fa-userId');

    if (userIdParam) {
      setUserId(userIdParam);
      sessionStorage.setItem('2fa-userId', userIdParam);
    } else if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // No userId - redirect to login
      router.replace('/login');
    }
  }, [searchParams, router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = useBackup
        ? { userId, backupCode: backupCode.toUpperCase().replace(/\s/g, '') }
        : { userId, token: token.replace(/\s/g, '') };

      const res = await fetch('/api/v1/auth/login/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setAttempts((prev) => prev + 1);
        throw new Error(data.errors?.[0]?.message || 'Invalid 2FA code');
      }

      // Success - clear stored userId and redirect to dashboard
      sessionStorage.removeItem('2fa-userId');
      
      // Get redirect path from query params or default to root
      const redirect = searchParams.get('redirect') || '/';
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify 2FA');
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-300">
        <div className="text-center">
          <p className="text-content-muted">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-300">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-2">Two-Factor Authentication</h2>
          <p className="text-content-muted mb-6">
            Enter the 6-digit code from your authenticator app
          </p>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {attempts >= 3 && (
            <div className="alert alert-warning mb-4">
              <span>
                Multiple failed attempts. If you've lost access to your authenticator app, use a
                backup code.
              </span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            {!useBackup ? (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Authentication Code</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  className="input input-bordered w-full text-center text-2xl tracking-widest"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  autoFocus
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-content-muted">
                    Open your authenticator app to get the code
                  </span>
                </label>
              </div>
            ) : (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Backup Code</span>
                </label>
                <input
                  type="text"
                  placeholder="XXXX-XXXX"
                  className="input input-bordered w-full text-center text-xl tracking-wider font-mono"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  maxLength={9}
                  autoFocus
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-content-muted">
                    Enter one of your saved backup codes
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={
                loading ||
                (!useBackup && token.length !== 6) ||
                (useBackup && backupCode.length < 8)
              }
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="divider">OR</div>

          <button
            onClick={() => {
              setUseBackup(!useBackup);
              setToken('');
              setBackupCode('');
              setError(null);
            }}
            className="btn btn-ghost btn-sm w-full"
            disabled={loading}
          >
            {useBackup ? 'Use Authenticator Code' : 'Use Backup Code'}
          </button>

          <div className="text-center mt-4">
            <a href="/login" className="link link-hover text-sm">
              Back to Login
            </a>
          </div>

          <div className="alert alert-info mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-sm">
              <strong>Lost your device?</strong> Use one of your backup codes to sign in, then
              disable and re-enable 2FA in Settings.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TwoFactorChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-base-300">
          <div className="text-center">
            <p className="text-content-muted">Loading 2FA challenge...</p>
          </div>
        </div>
      }
    >
      <TwoFactorChallengeContent />
    </Suspense>
  );
}
