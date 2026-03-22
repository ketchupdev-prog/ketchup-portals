'use client';

import { useState } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { getReconciliationStatus, getReconciliationHistory, triggerReconciliation, formatCurrency } from '@/lib/api/financial';
import { TrendChart } from '@/components/financial/trend-chart';
import { AlertBanner } from '@/components/financial/alert-banner';
import { downloadCSV, generateCSV } from '@/lib/export-pdf';

export default function ReconciliationPage() {
  const [triggering, setTriggering] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const { data: status, loading: statusLoading, refetch: refetchStatus } = usePolling({
    fetcher: getReconciliationStatus,
    interval: 60000,
  });

  const { data: history, loading: historyLoading } = usePolling({
    fetcher: () => getReconciliationHistory(90),
    interval: 300000,
  });

  const handleTriggerReconciliation = async () => {
    setTriggering(true);
    try {
      await triggerReconciliation();
      await refetchStatus();
      alert('Reconciliation triggered successfully');
    } catch (error) {
      alert(`Failed to trigger reconciliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleExportCSV = () => {
    if (!history) return;
    const csv = generateCSV(
      history,
      ['date', 'walletSum', 'trustBalance', 'discrepancy', 'status', 'notes']
    );
    downloadCSV(csv, `reconciliation-history-${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (statusLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const discrepancyAlert = status && Math.abs(status.discrepancy) > 10000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Trust Reconciliation</h1>
          <p className="text-sm text-content-muted mt-1">Daily reconciliation monitoring (PSD-3 §18)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn btn-outline btn-sm">
            📥 Export CSV
          </button>
          <button onClick={handleTriggerReconciliation} disabled={triggering} className="btn btn-primary btn-sm">
            {triggering ? <span className="loading loading-spinner loading-xs"></span> : '🔄 Run Now'}
          </button>
        </div>
      </div>

      {discrepancyAlert && showAlert && (
        <AlertBanner
          type="error"
          title="Critical Discrepancy Detected"
          message={`Trust account discrepancy of ${formatCurrency(Math.abs(status.discrepancy))} exceeds N$10,000 threshold. System operations may be halted. Immediate investigation required.`}
          onDismiss={() => setShowAlert(false)}
        />
      )}

      <div className="card bg-base-200 border-2 border-base-300">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Daily Reconciliation Status</h2>
            <div className="badge badge-lg badge-success">{status?.status || 'UNKNOWN'}</div>
          </div>
          <div className="divider my-0"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-content-muted">Date:</span>
                  <span className="font-semibold">{status?.date || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-content-muted">Status:</span>
                  <span className={`font-bold ${status?.status === 'PASS' ? 'text-success' : status?.status === 'WARNING' ? 'text-warning' : 'text-error'}`}>
                    {status?.status === 'PASS' ? '✓ PASS' : status?.status === 'WARNING' ? '⚠️ WARNING' : '❌ CRITICAL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-content-muted">Discrepancy:</span>
                  <span className={`font-bold ${Math.abs(status?.discrepancy || 0) === 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(status?.discrepancy || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-content-muted">Tolerance:</span>
                  <span className="font-semibold">±{formatCurrency(status?.tolerance || 0.01)}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-content-muted">Wallet Balances Sum:</span>
                  <span className="font-bold text-lg">{formatCurrency(status?.walletBalancesSum || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-content-muted">Trust Account Balance:</span>
                  <span className="font-bold text-lg">{formatCurrency(status?.trustAccountBalance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-content-muted">Difference:</span>
                  <span className={`font-bold text-lg ${Math.abs(status?.discrepancy || 0) === 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(status?.discrepancy || 0)} {Math.abs(status?.discrepancy || 0) === 0 ? '✓' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="divider my-2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-content-muted">Last Reconciliation:</span>
              <span className="font-medium">{status?.lastReconciliation ? new Date(status.lastReconciliation).toLocaleString('en-NA') : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Next Scheduled:</span>
              <span className="font-medium">{status?.nextScheduled ? new Date(status.nextScheduled).toLocaleString('en-NA') : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">90-Day Discrepancy Trend</h3>
            <TrendChart
              data={(history || []).map((h) => ({ date: h.date, value: h.discrepancy }))}
              yAxisLabel="Discrepancy (NAD)"
              color={Math.abs(status?.discrepancy || 0) > 10000 ? '#ef4444' : '#10b981'}
              height={250}
            />
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-2">Reconciliation Status Logic</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-success/10 rounded border-l-4 border-success">
                <span className="text-2xl">✓</span>
                <div>
                  <div className="font-bold text-success">PASS</div>
                  <div className="text-xs text-content-muted">|discrepancy| ≤ N$0.01</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded border-l-4 border-warning">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-bold text-warning">WARNING</div>
                  <div className="text-xs text-content-muted">N$0.01 &lt; |discrepancy| ≤ N$10,000</div>
                  <div className="text-xs text-content-muted mt-1">Action: Investigation required</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-error/10 rounded border-l-4 border-error">
                <span className="text-2xl">❌</span>
                <div>
                  <div className="font-bold text-error">CRITICAL</div>
                  <div className="text-xs text-content-muted">|discrepancy| &gt; N$10,000</div>
                  <div className="text-xs text-content-muted mt-1">Action: Halt system, email compliance + BoN</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">30-Day Reconciliation History</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Wallet Sum</th>
                  <th>Trust Balance</th>
                  <th>Discrepancy</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(history || []).slice(0, 30).map((rec) => (
                  <tr key={rec.date} className={rec.status === 'CRITICAL' ? 'bg-error/10' : rec.status === 'WARNING' ? 'bg-warning/10' : ''}>
                    <td className="font-medium">{rec.date}</td>
                    <td>{formatCurrency(rec.walletSum)}</td>
                    <td>{formatCurrency(rec.trustBalance)}</td>
                    <td className={Math.abs(rec.discrepancy) === 0 ? 'text-success' : 'text-error font-bold'}>
                      {formatCurrency(rec.discrepancy)}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${rec.status === 'PASS' ? 'badge-success' : rec.status === 'WARNING' ? 'badge-warning' : 'badge-error'}`}
                      >
                        {rec.status === 'PASS' ? '✓ PASS' : rec.status === 'WARNING' ? '⚠️ WARNING' : '❌ CRITICAL'}
                      </span>
                    </td>
                    <td className="text-xs text-content-muted">{rec.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
