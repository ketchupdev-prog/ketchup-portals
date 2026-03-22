'use client';

import { useEffect, useState } from 'react';
import { AlertBanner } from '@/components/admin/alert-banner';
import { getBonReportQueue, submitBonReport, retryBonReport } from '@/lib/api/compliance';
import type { BonReportQueue, BonReport, BonReportStatus } from '@/lib/types/compliance';

function getStatusBadge(status: BonReportStatus) {
  switch (status) {
    case 'SUBMITTED':
      return <span className="badge badge-success">Submitted ✓</span>;
    case 'PENDING':
      return <span className="badge badge-warning">Pending</span>;
    case 'SUBMITTING':
      return <span className="badge badge-info">Submitting...</span>;
    case 'FAILED':
      return <span className="badge badge-error">Failed</span>;
    case 'OVERDUE':
      return <span className="badge badge-error">Overdue</span>;
    default:
      return <span className="badge badge-ghost">Unknown</span>;
  }
}

function getReportTypeName(type: string): string {
  const types: Record<string, string> = {
    INCIDENT: 'Incident Report',
    KRI: 'KRI Quarterly Report',
    TRANSACTION: 'Transaction Summary',
    KYC: 'KYC Compliance',
    FRAUD: 'Fraud Detection',
    AUDIT: 'Annual Audit',
  };
  return types[type] || type;
}

function isOverdue(deadline: string): boolean {
  return new Date(deadline) < new Date();
}

function getTimeUntilDeadline(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  
  if (diff < 0) return 'Overdue';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

export default function BoNReportingPage() {
  const [queue, setQueue] = useState<BonReportQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<BonReport | null>(null);

  const fetchQueue = async () => {
    const response = await getBonReportQueue();
    if (response.success && response.data) {
      setQueue(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch report queue');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (reportId: string) => {
    setSubmittingId(reportId);
    const response = await submitBonReport(reportId);
    
    if (response.success) {
      await fetchQueue();
    } else {
      setError(response.error || 'Failed to submit report');
    }
    setSubmittingId(null);
  };

  const handleRetry = async (reportId: string) => {
    setSubmittingId(reportId);
    const response = await retryBonReport(reportId);
    
    if (response.success) {
      await fetchQueue();
    } else {
      setError(response.error || 'Failed to retry report submission');
    }
    setSubmittingId(null);
  };

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
          <h1 className="text-3xl font-bold text-base-content">BoN Reporting Queue</h1>
          <p className="text-sm text-content-muted mt-1">Bank of Namibia submission queue (PSD-3 §18)</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchQueue}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <AlertBanner
          type="error"
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {queue && queue.overdueCount > 0 && (
        <AlertBanner
          type="error"
          title="Overdue Reports"
          message={`${queue.overdueCount} report${queue.overdueCount > 1 ? 's are' : ' is'} past the 24-hour deadline. Submit immediately to avoid regulatory penalties.`}
        />
      )}

      {queue && queue.pendingCount > 0 && queue.overdueCount === 0 && (
        <AlertBanner
          type="warning"
          message={`${queue.pendingCount} report${queue.pendingCount > 1 ? 's' : ''} pending submission`}
        />
      )}

      <div className="stats stats-vertical lg:stats-horizontal shadow">
        <div className="stat">
          <div className="stat-title">Pending</div>
          <div className="stat-value text-warning">{queue?.pendingCount || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Overdue</div>
          <div className="stat-value text-error">{queue?.overdueCount || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Reports</div>
          <div className="stat-value">{queue?.reports.length || 0}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Type</th>
              <th>Created</th>
              <th>Deadline</th>
              <th>Time Left</th>
              <th>Status</th>
              <th>Retries</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue?.reports.map((report) => (
              <tr key={report.id} className={isOverdue(report.deadline) ? 'bg-error/10' : ''}>
                <td className="font-mono text-xs">{report.id}</td>
                <td>{getReportTypeName(report.reportType)}</td>
                <td className="text-sm">{new Date(report.createdAt).toLocaleString()}</td>
                <td className="text-sm">{new Date(report.deadline).toLocaleString()}</td>
                <td className={isOverdue(report.deadline) ? 'text-error font-bold' : ''}>
                  {getTimeUntilDeadline(report.deadline)}
                </td>
                <td>{getStatusBadge(report.status)}</td>
                <td className="text-center">{report.retryCount}</td>
                <td>
                  <div className="flex gap-2">
                    {report.status === 'PENDING' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSubmit(report.id)}
                        disabled={submittingId === report.id}
                      >
                        {submittingId === report.id ? 'Submitting...' : 'Submit'}
                      </button>
                    )}
                    {report.status === 'FAILED' && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleRetry(report.id)}
                        disabled={submittingId === report.id}
                      >
                        {submittingId === report.id ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setSelectedReport(report)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Report Details</h3>
            <div className="py-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Report ID</p>
                <p className="text-sm text-content-muted font-mono">{selectedReport.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-content-muted">{getReportTypeName(selectedReport.reportType)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                {getStatusBadge(selectedReport.status)}
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-content-muted">{new Date(selectedReport.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className="text-sm text-content-muted">{new Date(selectedReport.deadline).toLocaleString()}</p>
              </div>
              {selectedReport.submittedAt && (
                <div>
                  <p className="text-sm font-medium">Submitted At</p>
                  <p className="text-sm text-content-muted">{new Date(selectedReport.submittedAt).toLocaleString()}</p>
                </div>
              )}
              {selectedReport.errorMessage && (
                <div>
                  <p className="text-sm font-medium">Error Message</p>
                  <p className="text-sm text-error">{selectedReport.errorMessage}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Retry Count</p>
                <p className="text-sm text-content-muted">{selectedReport.retryCount}</p>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setSelectedReport(null)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
