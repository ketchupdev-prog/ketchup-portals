'use client';

/**
 * Two-Factor Authentication Setup Page
 * Location: src/app/settings/2fa/page.tsx
 * 
 * Features:
 * - Show 2FA status (enabled/disabled)
 * - Enable 2FA: Generate QR code, show backup codes
 * - Verify TOTP token to enable 2FA
 * - Disable 2FA (requires password + current token)
 * - Download/copy backup codes
 * 
 * Security:
 * - Requires authenticated session
 * - Shows banner if 2FA is required for role
 * - Warns when disabling 2FA
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Setup2FAData = {
  secret: string;
  qrCodeDataURL: string;
  backupCodes: string[];
};

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [required2FA, setRequired2FA] = useState(false);
  const [setupData, setSetupData] = useState<Setup2FAData | null>(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'disable'>('status');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/v1/portal/me', { credentials: 'include' });
      if (res.status === 401) {
        router.replace('/login?redirect=/settings/2fa');
        return;
      }
      const data = await res.json();
      setTotpEnabled(data.totpEnabled ?? false);
      setRequired2FA(
        ['ketchup_finance', 'ketchup_compliance', 'ketchup_ops'].includes(data.role)
      );
      setLoading(false);
    } catch (err) {
      setError('Failed to load user information');
      setLoading(false);
    }
  }

  async function handleSetup() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/2fa/setup', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.errors?.[0]?.message || 'Failed to set up 2FA');
      }

      const data = await res.json();
      setSetupData(data.data);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: verifyToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.errors?.[0]?.message || 'Invalid 2FA code');
      }

      setSuccess('2FA successfully enabled! Your account is now more secure.');
      setTotpEnabled(true);
      setVerifyToken('');
      setSetupData(null);
      setStep('status');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          password: disablePassword,
          token: disableToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.errors?.[0]?.message || 'Failed to disable 2FA');
      }

      setSuccess('2FA has been disabled. Consider re-enabling it for better security.');
      setTotpEnabled(false);
      setDisablePassword('');
      setDisableToken('');
      setStep('status');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    if (!setupData) return;
    const text = setupData.backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setSuccess('Backup codes copied to clipboard!');
  }

  function downloadBackupCodes() {
    if (!setupData) return;
    const text = setupData.backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ketchup-portals-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !setupData) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-content-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
        <p className="text-content-muted mb-8">
          Protect your account with an extra layer of security
        </p>

        {required2FA && !totpEnabled && (
          <div className="alert alert-warning mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              <strong>2FA Required:</strong> Your role requires two-factor authentication.
              Please enable it now.
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <span>{success}</span>
          </div>
        )}

        {step === 'status' && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Status</h2>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`badge ${totpEnabled ? 'badge-success' : 'badge-warning'} badge-lg`}
                >
                  {totpEnabled ? '✓ 2FA Enabled' : '✗ 2FA Disabled'}
                </div>
                {totpEnabled && (
                  <span className="text-sm text-content-muted">Your account is protected</span>
                )}
              </div>

              {totpEnabled ? (
                <div className="space-y-4">
                  <p className="text-sm text-content-muted">
                    Two-factor authentication is enabled. You'll need your authenticator app to
                    sign in.
                  </p>
                  <button
                    onClick={() => setStep('disable')}
                    className="btn btn-error"
                    disabled={loading}
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-content-muted">
                    Add an extra layer of security to your account by requiring a code from your
                    authenticator app in addition to your password.
                  </p>
                  <button
                    onClick={handleSetup}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'verify' && setupData && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Set Up Authenticator App</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Step 1: Scan QR Code</h3>
                  <p className="text-sm text-content-muted mb-4">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy,
                    etc.)
                  </p>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img
                      src={setupData.qrCodeDataURL}
                      alt="2FA QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 2: Save Backup Codes</h3>
                  <p className="text-sm text-content-muted mb-4">
                    Save these backup codes in a safe place. You can use them to sign in if you
                    lose access to your authenticator app.
                  </p>
                  <div className="bg-base-300 p-4 rounded-lg font-mono text-sm">
                    {setupData.backupCodes.map((code, idx) => (
                      <div key={idx}>{code}</div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={copyBackupCodes} className="btn btn-sm">
                      Copy Codes
                    </button>
                    <button onClick={downloadBackupCodes} className="btn btn-sm">
                      Download Codes
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Step 3: Verify</h3>
                  <p className="text-sm text-content-muted mb-4">
                    Enter the 6-digit code from your authenticator app to verify
                  </p>
                  <input
                    type="text"
                    placeholder="000000"
                    className="input input-bordered w-full max-w-xs mb-4"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerify}
                      className="btn btn-primary"
                      disabled={loading || verifyToken.length !== 6}
                    >
                      {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
                    </button>
                    <button
                      onClick={() => {
                        setStep('status');
                        setSetupData(null);
                        setVerifyToken('');
                      }}
                      className="btn"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'disable' && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-error">Disable Two-Factor Authentication</h2>
              <div className="alert alert-warning mb-4">
                <span>
                  <strong>Warning:</strong> Disabling 2FA will make your account less secure. You
                  will need both your password and current 2FA code to proceed.
                </span>
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Your Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="input input-bordered w-full"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Current 2FA Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    className="input input-bordered w-full max-w-xs"
                    value={disableToken}
                    onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDisable}
                    className="btn btn-error"
                    disabled={
                      loading || !disablePassword || disableToken.length !== 6
                    }
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                  <button
                    onClick={() => {
                      setStep('status');
                      setDisablePassword('');
                      setDisableToken('');
                    }}
                    className="btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
