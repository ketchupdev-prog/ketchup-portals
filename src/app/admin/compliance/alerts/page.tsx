'use client';

import { useEffect, useState } from 'react';
import { AlertBanner } from '@/components/admin/alert-banner';
import { getComplianceAlerts, resolveAlert } from '@/lib/api/compliance';
import type { ComplianceAlert, ComplianceAlertSeverity } from '@/lib/types/compliance';

function getSeverityBadge(severity: ComplianceAlertSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return <span className="badge badge-error">Critical</span>;
    case 'WARNING':
      return <span className="badge badge-warning">Warning</span>;
    case 'INFO':
      return <span className="badge badge-info">Info</span>;
    default:
      return <span className="badge badge-ghost">Unknown</span>;
  }
}

function getAlertTypeName(type: string): string {
  const types: Record<string, string> = {
    KRI_BREACH: 'KRI Threshold Breach',
    BON_OVERDUE: 'BoN Report Overdue',
    SECURITY_INCIDENT: 'Security Incident',
    REGULATORY_VIOLATION: 'Regulatory Violation',
    SYSTEM_FAILURE: 'System Failure',
  };
  return types[type] || type;
}

export default function ComplianceAlertsPage() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  const fetchAlerts = async () => {
    const response = await getComplianceAlerts();
    if (response.success && response.data) {
      setAlerts(response.data.alerts);
      setActiveCount(response.data.activeCount);
      setCriticalCount(response.data.criticalCount);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch compliance alerts');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    const response = await resolveAlert(alertId);

    if (response.success) {
      await fetchAlerts();
    } else {
      setError(response.error || 'Failed to resolve alert');
    }
    setResolvingId(null);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'active') return !alert.resolvedAt;
    if (filter === 'resolved') return !!alert.resolvedAt;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Compliance Alerts</h1>
          <p className="text-sm text-content-muted mt-1">Active compliance alerts and incident history</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchAlerts}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <AlertBanner type="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}

      {criticalCount > 0 && (
        <AlertBanner
          type="error"
          title="Critical Alerts"
          message={`${criticalCount} critical alert${criticalCount > 1 ? 's require' : ' requires'} immediate attention.`}
        />
      )}

      <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-title">Active Alerts</div>
          <div className="stat-value text-warning">{activeCount}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Critical</div>
          <div className="stat-value text-error">{criticalCount}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Alerts</div>
          <div className="stat-value">{alerts.length}</div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="tabs tabs-boxed">
              <button
                className={`tab ${filter === 'active' ? 'tab-active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active ({alerts.filter((a) => !a.resolvedAt).length})
              </button>
              <button
                className={`tab ${filter === 'resolved' ? 'tab-active' : ''}`}
                onClick={() => setFilter('resolved')}
              >
                Resolved ({alerts.filter((a) => a.resolvedAt).length})
              </button>
              <button
                className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({alerts.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Created</th>
                  <th>Resolved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-content-muted">
                      No alerts to display
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.id} className={alert.severity === 'CRITICAL' ? 'bg-error/10' : ''}>
                      <td>{getSeverityBadge(alert.severity)}</td>
                      <td className="text-sm">{getAlertTypeName(alert.type)}</td>
                      <td className="font-medium">{alert.title}</td>
                      <td className="text-sm">{new Date(alert.createdAt).toLocaleString()}</td>
                      <td className="text-sm">
                        {alert.resolvedAt ? (
                          <span className="badge badge-success badge-sm">
                            {new Date(alert.resolvedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="badge badge-ghost badge-sm">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            View
                          </button>
                          {!alert.resolvedAt && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleResolve(alert.id)}
                              disabled={resolvingId === alert.id}
                            >
                              {resolvingId === alert.id ? 'Resolving...' : 'Resolve'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedAlert && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{selectedAlert.title}</h3>
            <div className="py-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Severity</p>
                {getSeverityBadge(selectedAlert.severity)}
              </div>
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-content-muted">{getAlertTypeName(selectedAlert.type)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Message</p>
                <p className="text-sm text-content-muted">{selectedAlert.message}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created At</p>
                <p className="text-sm text-content-muted">
                  {new Date(selectedAlert.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedAlert.resolvedAt && (
                <div>
                  <p className="text-sm font-medium">Resolved At</p>
                  <p className="text-sm text-content-muted">
                    {new Date(selectedAlert.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedAlert.metadata && (
                <div>
                  <p className="text-sm font-medium">Additional Info</p>
                  <pre className="text-xs bg-base-300 p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="modal-action">
              {!selectedAlert.resolvedAt && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    handleResolve(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  disabled={resolvingId === selectedAlert.id}
                >
                  Resolve
                </button>
              )}
              <button className="btn" onClick={() => setSelectedAlert(null)}>
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setSelectedAlert(null)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
