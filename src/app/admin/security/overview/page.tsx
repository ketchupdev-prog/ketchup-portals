'use client';

import { useEffect, useState } from 'react';
import { getSecurityOverview } from '@/lib/api/security';
import type { SecurityOverview, SecurityEvent } from '@/lib/types/security';

/**
 * Security Overview Dashboard – Fraud detection, 2FA, authentication, and security metrics
 * PSD-12 Compliance: Cybersecurity monitoring and reporting
 */

export default function SecurityOverviewPage() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadOverview();
    const interval = setInterval(loadOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadOverview() {
    const response = await getSecurityOverview();
    if (response.success && response.data) {
      setOverview(response.data);
      setError(null);
      setLastUpdate(new Date());
    } else {
      setError(response.error || 'Failed to load security overview');
    }
    setLoading(false);
  }

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
          <h1 className="text-3xl font-bold text-base-content">Security Overview</h1>
          <p className="text-sm text-content-muted mt-1">Fraud detection, 2FA, authentication & security metrics</p>
        </div>
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Security Overview</h1>
          <p className="text-sm text-content-muted mt-1">No data available</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'GOOD';
    if (score >= 70) return 'FAIR';
    return 'POOR';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'success';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'blocked':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Security Overview</h1>
          <p className="text-sm text-content-muted mt-1">
            Fraud detection, 2FA, authentication & security metrics (PSD-12)
          </p>
        </div>
        <div className="text-xs text-content-muted">
          Last updated: {lastUpdate.toLocaleTimeString()}
          <button onClick={loadOverview} className="btn btn-xs btn-ghost ml-2">
            🔄
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`card bg-base-200 border-l-4 border-${getScoreColor(overview.securityScore.overall)}`}>
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Security Score</h3>
            <p className="text-3xl font-bold">{overview.securityScore.overall}%</p>
            <div className={`badge badge-${getScoreColor(overview.securityScore.overall)}`}>
              {getScoreLabel(overview.securityScore.overall)}
            </div>
          </div>
        </div>

        <div
          className={`card bg-base-200 border-l-4 border-${
            overview.twoFactorAdoption.percentage >= 95
              ? 'success'
              : overview.twoFactorAdoption.percentage >= 80
                ? 'warning'
                : 'error'
          }`}
        >
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">2FA Adoption</h3>
            <p className="text-3xl font-bold">{overview.twoFactorAdoption.percentage}%</p>
            <p className="text-xs text-content-muted">
              {overview.twoFactorAdoption.enabled} / {overview.twoFactorAdoption.total} users
            </p>
          </div>
        </div>

        <div
          className={`card bg-base-200 border-l-4 border-${
            overview.failedLogins.status === 'normal'
              ? 'success'
              : overview.failedLogins.status === 'warning'
                ? 'warning'
                : 'error'
          }`}
        >
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Failed Login Attempts</h3>
            <p className="text-3xl font-bold">{overview.failedLogins.count24h}</p>
            <p className="text-xs text-content-muted">
              Threshold: {overview.failedLogins.threshold} (24h)
            </p>
          </div>
        </div>

        <div className="card bg-base-200 border-l-4 border-primary">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Active Sessions</h3>
            <p className="text-3xl font-bold">{overview.activeSessions.count}</p>
            <p className="text-xs text-content-muted">{overview.activeSessions.unique_users} unique users</p>
          </div>
        </div>
      </div>

      {/* Security Score Breakdown */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Security Score Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(overview.securityScore.breakdown).map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .replace(/^\w/, (c) => c.toUpperCase());
              return (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-48 text-sm font-medium">{label}</div>
                  <div className="flex-1">
                    <div className="w-full bg-base-300 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full bg-${getScoreColor(value)}`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-right font-mono text-sm">{value}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Security Events */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Recent Security Events</h2>
            {overview.recentEvents.length === 0 ? (
              <p className="text-sm text-content-muted">No recent events</p>
            ) : (
              <div className="space-y-2">
                {overview.recentEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className={`alert alert-${getSeverityColor(event.severity)} py-2`}>
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-xs font-mono">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.action}</p>
                        <p className="text-xs opacity-80">
                          {event.user} • {event.ipAddress}
                        </p>
                      </div>
                      <span className={`badge badge-${getStatusColor(event.status)} badge-sm`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Security Recommendations</h2>
            {overview.recommendations.length === 0 ? (
              <div className="alert alert-success">
                <span>✓ All security checks passed</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {overview.recommendations.map((rec) => (
                  <li key={rec.id} className="flex items-start gap-2">
                    <span className={`text-${getSeverityColor(rec.severity)}`}>
                      {rec.severity === 'HIGH' || rec.severity === 'CRITICAL' ? '⚠️' : rec.severity === 'MEDIUM' ? '⚡' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-content-muted">{rec.description}</p>
                      {rec.actionable && rec.actionUrl && (
                        <a href={rec.actionUrl} className="text-xs text-primary hover:underline">
                          Take Action →
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
