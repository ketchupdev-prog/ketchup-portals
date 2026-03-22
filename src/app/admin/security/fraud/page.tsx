'use client';

import { useEffect, useState } from 'react';
import { getFraudDetectionMetrics, updateFraudDetectionStatus } from '@/lib/api/security';
import type { FraudDetectionMetrics, FraudDetection, RiskLevel } from '@/lib/types/security';

/**
 * Fraud Detection Dashboard – Real-time fraud monitoring and ML-based detection
 * PSD-12 Compliance: Transaction monitoring and fraud prevention
 */

export default function FraudDetectionPage() {
  const [metrics, setMetrics] = useState<FraudDetectionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<FraudDetection | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    const response = await getFraudDetectionMetrics();
    if (response.success && response.data) {
      setMetrics(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to load fraud detection metrics');
    }
    setLoading(false);
  }

  async function handleStatusUpdate(detectionId: string, status: 'approved' | 'fraud' | 'reviewing') {
    setUpdating(true);
    const response = await updateFraudDetectionStatus(detectionId, status);
    if (response.success) {
      await loadMetrics();
      setSelectedDetection(null);
    } else {
      alert(`Failed to update status: ${response.error}`);
    }
    setUpdating(false);
  }

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'info';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 71) return 'error';
    if (score >= 41) return 'warning';
    return 'success';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'blocked':
        return 'error';
      case 'fraud':
        return 'error';
      case 'reviewing':
        return 'warning';
      case 'approved':
        return 'success';
      default:
        return 'info';
    }
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
          <h1 className="text-3xl font-bold text-base-content">Fraud Detection</h1>
          <p className="text-sm text-content-muted mt-1">Real-time fraud monitoring and ML-based detection</p>
        </div>
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Fraud Detection</h1>
          <p className="text-sm text-content-muted mt-1">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Fraud Detection</h1>
          <p className="text-sm text-content-muted mt-1">Real-time fraud monitoring and ML-based detection</p>
        </div>
        <button onClick={loadMetrics} className="btn btn-sm btn-primary">
          🔄 Refresh
        </button>
      </div>

      {/* 24-Hour Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-base-200 border-l-4 border-warning">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Suspicious Transactions</h3>
            <p className="text-3xl font-bold">{metrics.stats24h.suspiciousTransactions}</p>
            <p className="text-xs text-content-muted">Flagged (24h)</p>
          </div>
        </div>

        <div className="card bg-base-200 border-l-4 border-error">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Blocked</h3>
            <p className="text-3xl font-bold">{metrics.stats24h.blockedTransactions}</p>
            <p className="text-xs text-content-muted">Auto-blocked</p>
          </div>
        </div>

        <div className="card bg-base-200 border-l-4 border-warning">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Under Review</h3>
            <p className="text-3xl font-bold">{metrics.stats24h.underReview}</p>
            <p className="text-xs text-content-muted">Manual review</p>
          </div>
        </div>

        <div className="card bg-base-200 border-l-4 border-info">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">False Positives</h3>
            <p className="text-3xl font-bold">{metrics.stats24h.falsePositives}</p>
            <p className="text-xs text-content-muted">User contested</p>
          </div>
        </div>

        <div className="card bg-base-200 border-l-4 border-error">
          <div className="card-body">
            <h3 className="text-sm font-medium text-content-muted">Confirmed Fraud</h3>
            <p className="text-3xl font-bold">{metrics.stats24h.confirmedFraud}</p>
            <p className="text-xs text-error">
              Rate: {(metrics.stats24h.fraudRate * 100).toFixed(3)}%
            </p>
          </div>
        </div>
      </div>

      {/* ML Model Performance */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">ML Model Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="stat">
              <div className="stat-title">Accuracy</div>
              <div className="stat-value text-2xl">{(metrics.mlModelPerformance.accuracy * 100).toFixed(1)}%</div>
            </div>
            <div className="stat">
              <div className="stat-title">Precision</div>
              <div className="stat-value text-2xl">{(metrics.mlModelPerformance.precision * 100).toFixed(1)}%</div>
            </div>
            <div className="stat">
              <div className="stat-title">Recall</div>
              <div className="stat-value text-2xl">{(metrics.mlModelPerformance.recall * 100).toFixed(1)}%</div>
            </div>
            <div className="stat">
              <div className="stat-title">F1 Score</div>
              <div className="stat-value text-2xl">{(metrics.mlModelPerformance.f1Score * 100).toFixed(1)}%</div>
            </div>
            <div className="stat">
              <div className="stat-title">False Positive Rate</div>
              <div className="stat-value text-2xl">{(metrics.mlModelPerformance.falsePositiveRate * 100).toFixed(1)}%</div>
            </div>
          </div>
          <p className="text-xs text-content-muted mt-2">
            Last updated: {new Date(metrics.mlModelPerformance.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Risk Factors (Weighted)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {metrics.riskFactors.map((factor) => (
              <div key={factor.id} className="flex items-center gap-4 p-3 bg-base-300 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{factor.name}</span>
                    {!factor.enabled && <span className="badge badge-ghost badge-sm">Disabled</span>}
                  </div>
                  <p className="text-xs text-content-muted mt-1">{factor.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{(factor.weight * 100).toFixed(0)}%</div>
                  <div className="text-xs text-content-muted">Weight</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Fraud Detections */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Fraud Detection Feed</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Flags</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentDetections.map((detection) => (
                  <tr key={detection.id}>
                    <td className="font-mono text-xs">
                      {new Date(detection.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="font-mono text-xs">{detection.transactionId}</td>
                    <td>{detection.userName || detection.userId}</td>
                    <td className="font-mono">
                      {detection.currency}${detection.amount.toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-${getRiskScoreColor(detection.riskScore)}`}>
                          {detection.riskScore}%
                        </span>
                        <span className={`badge badge-${getRiskLevelColor(detection.riskLevel)} badge-sm`}>
                          {detection.riskLevel}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {detection.flags.map((flag, i) => (
                          <span key={i} className="badge badge-ghost badge-xs">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusBadge(detection.status)}`}>
                        {detection.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedDetection(detection)}
                        className="btn btn-xs btn-primary"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Investigation Modal */}
      {selectedDetection && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Fraud Investigation</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-content-muted">Transaction ID</label>
                  <p className="font-mono">{selectedDetection.transactionId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-content-muted">User</label>
                  <p>{selectedDetection.userName || selectedDetection.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-content-muted">Amount</label>
                  <p className="font-mono">
                    {selectedDetection.currency}${selectedDetection.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-content-muted">Risk Score</label>
                  <p>
                    <span className={`badge badge-${getRiskScoreColor(selectedDetection.riskScore)}`}>
                      {selectedDetection.riskScore}% {selectedDetection.riskLevel}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-content-muted">Risk Flags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDetection.flags.map((flag, i) => (
                    <span key={i} className="badge badge-warning">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>

              {selectedDetection.details && (
                <div>
                  <label className="text-sm font-medium text-content-muted">Additional Details</label>
                  <div className="bg-base-300 p-3 rounded mt-2 space-y-1">
                    {selectedDetection.details.device && (
                      <p className="text-sm">
                        <span className="font-medium">Device:</span> {selectedDetection.details.device}
                      </p>
                    )}
                    {selectedDetection.details.location && (
                      <p className="text-sm">
                        <span className="font-medium">Location:</span> {selectedDetection.details.location}
                      </p>
                    )}
                    {selectedDetection.details.velocity && (
                      <p className="text-sm">
                        <span className="font-medium">Velocity:</span> {selectedDetection.details.velocity}{' '}
                        transactions/5min
                      </p>
                    )}
                    {selectedDetection.details.kycStatus && (
                      <p className="text-sm">
                        <span className="font-medium">KYC Status:</span> {selectedDetection.details.kycStatus}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-action">
                <button
                  onClick={() => setSelectedDetection(null)}
                  className="btn btn-ghost"
                  disabled={updating}
                >
                  Close
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedDetection.id, 'approved')}
                  className="btn btn-success"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedDetection.id, 'reviewing')}
                  className="btn btn-warning"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Flag for Review'}
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedDetection.id, 'fraud')}
                  className="btn btn-error"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Confirm Fraud'}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedDetection(null)}></div>
        </div>
      )}
    </div>
  );
}
