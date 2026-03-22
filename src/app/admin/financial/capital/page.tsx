'use client';

import { usePolling } from '@/hooks/use-polling';
import { getCapitalAdequacy, formatCurrency } from '@/lib/api/financial';
import { TrendChart } from '@/components/financial/trend-chart';
import { AlertBanner } from '@/components/financial/alert-banner';

export default function CapitalAdequacyPage() {
  const { data: capital, loading } = usePolling({
    fetcher: getCapitalAdequacy,
    interval: 60000,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const isHealthy = (capital?.capitalAdequacyRatio || 0) >= 105;
  const isWarning = (capital?.capitalAdequacyRatio || 0) >= 100 && (capital?.capitalAdequacyRatio || 0) < 105;
  const isCritical = (capital?.capitalAdequacyRatio || 0) < 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Capital Adequacy</h1>
        <p className="text-sm text-content-muted mt-1">PSD-3 Compliance Monitoring</p>
      </div>

      {isCritical && (
        <AlertBanner
          type="error"
          title="Critical: Capital Adequacy Below 100%"
          message="Trust account balance is insufficient. System operations must be halted immediately. BoN notification required."
        />
      )}

      {isWarning && (
        <AlertBanner
          type="warning"
          title="Warning: Low Capital Cushion"
          message="Capital adequacy ratio is below 105%. Investigation and monitoring required."
        />
      )}

      <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Current Capital Adequacy Ratio</h2>
            <div
              className={`badge badge-lg ${isHealthy ? 'badge-success' : isWarning ? 'badge-warning' : 'badge-error'}`}
            >
              {isHealthy ? '✓ HEALTHY' : isWarning ? '⚠️ WARNING' : '❌ CRITICAL'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-base-200 rounded-lg">
              <div className="text-6xl font-bold text-primary mb-2">
                {((capital?.capitalAdequacyRatio || 0) * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-content-muted">Capital Adequacy Ratio</div>
              <div className="divider my-2"></div>
              <div className="flex justify-between text-xs">
                <span className="text-content-muted">Minimum Required (PSD-3):</span>
                <span className="font-bold">{((capital?.minimumRequired || 1) * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-base-200 rounded">
                <span className="text-sm text-content-muted">Total E-Money Issued:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(capital?.totalEMoneyIssued || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-base-200 rounded">
                <span className="text-sm text-content-muted">Trust Account Balance:</span>
                <span className="text-xl font-bold text-success">
                  {formatCurrency(capital?.trustAccountBalance || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-base-200 rounded">
                <span className="text-sm text-content-muted">Current Cushion:</span>
                <span
                  className={`text-xl font-bold ${(capital?.currentCushion || 0) > 0 ? 'text-success' : 'text-error'}`}
                >
                  {formatCurrency(capital?.currentCushion || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="text-lg font-bold mb-4">PSD-3 Compliance Status Thresholds</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-success/10 rounded-lg border-l-4 border-success">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">✓</span>
                <div className="font-bold text-success text-lg">HEALTHY</div>
              </div>
              <div className="text-sm text-content-muted">Ratio ≥ 105%</div>
              <div className="text-xs text-content-muted mt-2">
                Adequate cushion above regulatory minimum. Normal operations.
              </div>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border-l-4 border-warning">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⚠️</span>
                <div className="font-bold text-warning text-lg">WARNING</div>
              </div>
              <div className="text-sm text-content-muted">100% ≤ Ratio &lt; 105%</div>
              <div className="text-xs text-content-muted mt-2">
                Close to minimum. Investigation and monitoring required.
              </div>
            </div>
            <div className="p-4 bg-error/10 rounded-lg border-l-4 border-error">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">❌</span>
                <div className="font-bold text-error text-lg">CRITICAL</div>
              </div>
              <div className="text-sm text-content-muted">Ratio &lt; 100%</div>
              <div className="text-xs text-content-muted mt-2">
                Immediate halt of operations. BoN notification required.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="text-lg font-bold mb-4">90-Day Capital Adequacy Trend</h3>
          <TrendChart
            data={(capital?.history || []).map((h) => ({ date: h.date, value: h.ratio * 100 }))}
            yAxisLabel="Capital Adequacy Ratio (%)"
            color={isHealthy ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444'}
            height={300}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">E-Money Issuance vs Trust Balance</h3>
            <TrendChart
              data={(capital?.history || []).map((h) => ({
                date: h.date,
                value: h.issued,
                label: 'E-Money Issued',
              }))}
              yAxisLabel="Amount (NAD)"
              color="#3b82f6"
              height={250}
            />
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">Trust Account Balance History</h3>
            <TrendChart
              data={(capital?.history || []).map((h) => ({
                date: h.date,
                value: h.trust,
                label: 'Trust Balance',
              }))}
              yAxisLabel="Amount (NAD)"
              color="#10b981"
              height={250}
            />
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="text-lg font-bold mb-4">PSD-3 Regulatory Requirements</h3>
          <div className="prose max-w-none">
            <div className="bg-base-300 p-4 rounded">
              <h4 className="text-base font-semibold mb-2">§18 Trust Account Requirements</h4>
              <ul className="text-sm space-y-2">
                <li>
                  <strong>Minimum Coverage:</strong> Trust account balance must be ≥100% of total e-money outstanding
                </li>
                <li>
                  <strong>Daily Reconciliation:</strong> Required at 00:30 NAT to ensure compliance
                </li>
                <li>
                  <strong>Reporting:</strong> Monthly capital adequacy reports to Bank of Namibia
                </li>
                <li>
                  <strong>Breach Response:</strong> Immediate halt of issuance operations if ratio falls below 100%
                </li>
                <li>
                  <strong>Warning Threshold:</strong> Internal monitoring triggered at 105% ratio
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
