'use client';

import { useEffect, useState } from 'react';
import { get2FAStats, enforce2FA, send2FAReminderCampaign, add2FAExemption } from '@/lib/api/security';
import type { TwoFactorStats } from '@/lib/types/security';

/**
 * 2FA Monitoring Dashboard – Two-factor authentication adoption and enforcement
 * PSD-12 Compliance: Multi-factor authentication requirements
 */

export default function TwoFactorAuthPage() {
  const [stats, setStats] = useState<TwoFactorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [showExemptionModal, setShowExemptionModal] = useState(false);

  const [exemptionForm, setExemptionForm] = useState({
    userId: '',
    reason: '',
    expiresAt: '',
  });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 300000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    const response = await get2FAStats();
    if (response.success && response.data) {
      setStats(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to load 2FA statistics');
    }
    setLoading(false);
  }

  async function handleSendReminder(userType?: string) {
    setSendingReminder(true);
    const response = await send2FAReminderCampaign(userType);
    if (response.success && response.data) {
      alert(`Successfully sent 2FA reminder to ${response.data.sent} users`);
    } else {
      alert(`Failed to send reminder: ${response.error}`);
    }
    setSendingReminder(false);
  }

  async function handleAddExemption() {
    if (!exemptionForm.userId || !exemptionForm.reason || !exemptionForm.expiresAt) {
      alert('Please fill in all fields');
      return;
    }

    const response = await add2FAExemption(
      exemptionForm.userId,
      exemptionForm.reason,
      new Date(exemptionForm.expiresAt).toISOString()
    );

    if (response.success) {
      alert('Exemption added successfully');
      setShowExemptionModal(false);
      setExemptionForm({ userId: '', reason: '', expiresAt: '' });
      loadStats();
    } else {
      alert(`Failed to add exemption: ${response.error}`);
    }
  }

  const getAdoptionColor = (percentage: number) => {
    if (percentage >= 95) return 'success';
    if (percentage >= 80) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">2FA Monitoring</h1>
          <p className="text-sm text-content-muted mt-1">Two-factor authentication adoption and enforcement</p>
        </div>
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">2FA Monitoring</h1>
          <p className="text-sm text-content-muted mt-1">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">2FA Monitoring</h1>
          <p className="text-sm text-content-muted mt-1">
            Two-factor authentication adoption and enforcement (PSD-12)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSendReminder()}
            className="btn btn-sm btn-primary"
            disabled={sendingReminder}
          >
            {sendingReminder ? 'Sending...' : '📧 Send Reminder Campaign'}
          </button>
          <button onClick={() => setShowExemptionModal(true)} className="btn btn-sm btn-ghost">
            ➕ Add Exemption
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-base-200 border-l-4 border-primary">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Total Users</h3>
            <p className="text-3xl font-bold">{stats.overview.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-content-muted">Registered users</p>
          </div>
        </div>

        <div className={`card bg-base-200 border-l-4 border-${getAdoptionColor(stats.overview.adoptionRate)}`}>
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">2FA Adoption Rate</h3>
            <p className="text-3xl font-bold">{stats.overview.adoptionRate}%</p>
            <p className="text-xs text-content-muted">
              {stats.overview.twoFactorEnabled.toLocaleString()} users enabled
            </p>
          </div>
        </div>

        <div className="card bg-base-200 border-l-4 border-success">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">2FA Enabled</h3>
            <p className="text-3xl font-bold">{stats.overview.twoFactorEnabled.toLocaleString()}</p>
            <p className="text-xs text-success">Protected accounts</p>
          </div>
        </div>

        <div className="card bg-base-200 border-l-4 border-warning">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Not Enabled</h3>
            <p className="text-3xl font-bold">{stats.overview.twoFactorNotEnabled.toLocaleString()}</p>
            <p className="text-xs text-warning">Need enrollment</p>
          </div>
        </div>
      </div>

      {/* Adoption by User Type */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">2FA Enforcement by User Type</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>User Type</th>
                  <th>Total Users</th>
                  <th>2FA Enabled</th>
                  <th>Adoption Rate</th>
                  <th>Required</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.byUserType.map((userType) => (
                  <tr key={userType.userType}>
                    <td className="font-medium">{userType.userType}</td>
                    <td>{userType.total.toLocaleString()}</td>
                    <td>{userType.enabled.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="w-full bg-base-300 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full bg-${getAdoptionColor(userType.percentage)}`}
                              style={{ width: `${userType.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className={`badge badge-${getAdoptionColor(userType.percentage)}`}>
                          {userType.percentage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {userType.required ? (
                        <span className="badge badge-success">✓ Required</span>
                      ) : (
                        <span className="badge badge-ghost">Optional</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleSendReminder(userType.userType)}
                        className="btn btn-xs btn-primary"
                        disabled={sendingReminder}
                      >
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 2FA Methods */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">2FA Methods Distribution</h2>
            <div className="space-y-4 mt-4">
              {stats.byMethod.map((method) => (
                <div key={method.method} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium">{method.method}</div>
                  <div className="flex-1">
                    <div className="w-full bg-base-300 rounded-full h-4">
                      <div
                        className="h-4 rounded-full bg-primary"
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <span className="font-mono text-sm">{method.count.toLocaleString()}</span>
                    <span className="text-xs text-content-muted ml-2">({method.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Recent 2FA Enrollments</h2>
            {stats.recentEnrollments.length === 0 ? (
              <p className="text-sm text-content-muted">No recent enrollments</p>
            ) : (
              <div className="space-y-2">
                {stats.recentEnrollments.slice(0, 10).map((enrollment, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-base-300">
                    <div>
                      <p className="text-sm font-medium">{enrollment.userName}</p>
                      <p className="text-xs text-content-muted">
                        {new Date(enrollment.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="badge badge-success badge-sm">{enrollment.method}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exemptions */}
      {stats.exemptions && stats.exemptions.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">2FA Exemptions</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Reason</th>
                    <th>Approved By</th>
                    <th>Expires</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.exemptions.map((exemption, i) => {
                    const isExpired = new Date(exemption.expiresAt) < new Date();
                    return (
                      <tr key={i}>
                        <td>{exemption.userName}</td>
                        <td className="max-w-xs truncate">{exemption.reason}</td>
                        <td>{exemption.approvedBy}</td>
                        <td className="font-mono text-xs">
                          {new Date(exemption.expiresAt).toLocaleDateString()}
                        </td>
                        <td>
                          {isExpired ? (
                            <span className="badge badge-error badge-sm">Expired</span>
                          ) : (
                            <span className="badge badge-warning badge-sm">Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="card bg-base-300 border-l-4 border-info">
        <div className="card-body py-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📚</span>
            <div className="flex-1">
              <p className="text-sm font-medium">2FA Setup Guide</p>
              <p className="text-xs text-content-muted mt-1">
                Help users enable 2FA with step-by-step instructions and support for TOTP apps (Google Authenticator,
                Authy, 1Password).
              </p>
              <a href="/help/2fa-setup" className="text-xs text-primary hover:underline mt-1 inline-block">
                View Setup Guide →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Add Exemption Modal */}
      {showExemptionModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add 2FA Exemption</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">User ID</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter user ID"
                  className="input input-bordered w-full"
                  value={exemptionForm.userId}
                  onChange={(e) => setExemptionForm({ ...exemptionForm, userId: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Reason for Exemption</span>
                </label>
                <textarea
                  placeholder="Provide detailed justification..."
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  value={exemptionForm.reason}
                  onChange={(e) => setExemptionForm({ ...exemptionForm, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Expiration Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={exemptionForm.expiresAt}
                  onChange={(e) => setExemptionForm({ ...exemptionForm, expiresAt: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="alert alert-warning">
                <span className="text-xs">
                  ⚠️ Exemptions should only be granted for legitimate technical or accessibility reasons. All
                  exemptions are logged and auditable.
                </span>
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowExemptionModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={handleAddExemption} className="btn btn-primary">
                Add Exemption
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowExemptionModal(false)}></div>
        </div>
      )}
    </div>
  );
}
