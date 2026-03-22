'use client';

import { usePolling } from '@/hooks/use-polling';
import { getVoucherFinancials, formatCurrency, formatNumber } from '@/lib/api/financial';
import { CustomPieChart } from '@/components/financial/pie-chart';

export default function VoucherFinancialsPage() {
  const { data: vouchers, loading } = usePolling({
    fetcher: getVoucherFinancials,
    interval: 60000,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const redemptionRate = vouchers ? (vouchers.redeemedCount / vouchers.totalIssued) * 100 : 0;
  const pendingRate = vouchers ? (vouchers.pendingCount / vouchers.totalIssued) * 100 : 0;
  const expiredRate = vouchers ? (vouchers.expiredCount / vouchers.totalIssued) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Voucher Financial Dashboard</h1>
        <p className="text-sm text-content-muted mt-1">
          SmartPay beneficiary voucher issuance, redemption, and liability tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">Total Issued</h3>
            <p className="text-3xl font-bold text-primary">{formatNumber(vouchers?.totalIssued || 0)}</p>
            <p className="text-sm font-semibold text-content-muted">{formatCurrency(vouchers?.totalValue || 0)}</p>
            <div className="text-xs text-content-muted mt-1">Total voucher value</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-success/20 to-success/5 border border-success/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">Redeemed</h3>
            <p className="text-3xl font-bold text-success">
              {formatNumber(vouchers?.redeemedCount || 0)} ({redemptionRate.toFixed(1)}%)
            </p>
            <p className="text-sm font-semibold text-content-muted">{formatCurrency(vouchers?.redeemedValue || 0)}</p>
            <div className="text-xs text-content-muted mt-1">Successfully redeemed</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">Pending</h3>
            <p className="text-3xl font-bold text-warning">
              {formatNumber(vouchers?.pendingCount || 0)} ({pendingRate.toFixed(1)}%)
            </p>
            <p className="text-sm font-semibold text-content-muted">{formatCurrency(vouchers?.pendingValue || 0)}</p>
            <div className="text-xs text-content-muted mt-1">Awaiting redemption</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-error/20 to-error/5 border border-error/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">Expired</h3>
            <p className="text-3xl font-bold text-error">
              {formatNumber(vouchers?.expiredCount || 0)} ({expiredRate.toFixed(1)}%)
            </p>
            <p className="text-sm font-semibold text-content-muted">{formatCurrency(vouchers?.expiredValue || 0)}</p>
            <div className="text-xs text-content-muted mt-1">Unclaimed/expired</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">Financial Impact</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-warning/10 rounded-lg border-l-4 border-warning">
                <div>
                  <div className="text-sm text-content-muted">Outstanding Liability</div>
                  <div className="text-xs text-content-muted mt-1">Pending + Expired vouchers</div>
                </div>
                <div className="text-2xl font-bold text-warning">
                  {formatCurrency(vouchers?.liabilityOutstanding || 0)}
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-success/10 rounded-lg border-l-4 border-success">
                <div>
                  <div className="text-sm text-content-muted">Redeemed (Settled)</div>
                  <div className="text-xs text-content-muted mt-1">Completed transactions</div>
                </div>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(vouchers?.redeemedValue || 0)}
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                <div>
                  <div className="text-sm text-content-muted">Float Required</div>
                  <div className="text-xs text-content-muted mt-1">Trust account reserve</div>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(vouchers?.floatRequired || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">Voucher Lifecycle Distribution</h3>
            <CustomPieChart
              data={[
                { name: 'Redeemed', value: vouchers?.redeemedCount || 0 },
                { name: 'Pending', value: vouchers?.pendingCount || 0 },
                { name: 'Expired', value: vouchers?.expiredCount || 0 },
              ]}
              height={250}
              colors={['#10b981', '#f59e0b', '#ef4444']}
            />
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="text-lg font-bold mb-4">Voucher Lifecycle Flow</h3>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary">
                  <div>
                    <div className="text-3xl font-bold text-primary">{formatNumber(vouchers?.totalIssued || 0)}</div>
                    <div className="text-xs text-content-muted">Issued</div>
                  </div>
                </div>
              </div>
              <div className="text-4xl text-content-muted">→</div>
              <div className="text-center">
                <div className="w-32 h-32 bg-info/20 rounded-full flex items-center justify-center border-4 border-info">
                  <div>
                    <div className="text-3xl font-bold text-info">100%</div>
                    <div className="text-xs text-content-muted">Distributed</div>
                  </div>
                </div>
              </div>
              <div className="text-4xl text-content-muted">→</div>
              <div className="text-center">
                <div className="w-32 h-32 bg-success/20 rounded-full flex items-center justify-center border-4 border-success">
                  <div>
                    <div className="text-3xl font-bold text-success">{formatNumber(vouchers?.redeemedCount || 0)}</div>
                    <div className="text-xs text-content-muted">Redeemed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <div className="w-24 h-24 bg-warning/20 rounded-full flex items-center justify-center border-4 border-warning">
                <div>
                  <div className="text-2xl font-bold text-warning">{formatNumber(vouchers?.pendingCount || 0)}</div>
                  <div className="text-xs text-content-muted">Pending</div>
                </div>
              </div>
              <div className="text-xs text-content-muted mt-2">{pendingRate.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-error/20 rounded-full flex items-center justify-center border-4 border-error">
                <div>
                  <div className="text-2xl font-bold text-error">{formatNumber(vouchers?.expiredCount || 0)}</div>
                  <div className="text-xs text-content-muted">Expired</div>
                </div>
              </div>
              <div className="text-xs text-content-muted mt-2">{expiredRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">Redemption Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-content-muted">Average Redemption Time:</span>
                <span className="text-2xl font-bold text-primary">
                  {(vouchers?.averageRedemptionDays || 0).toFixed(1)} days
                </span>
              </div>
              <div className="divider my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-content-muted">Redemption Rate:</span>
                <span className="text-2xl font-bold text-success">{redemptionRate.toFixed(1)}%</span>
              </div>
              <div className="progress progress-success">
                <div className="progress-bar" style={{ width: `${redemptionRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">Trust Account Impact</h3>
            <div className="space-y-3">
              <div className="alert alert-info">
                <span className="text-sm">
                  <strong>Float Required:</strong> {formatCurrency(vouchers?.floatRequired || 0)} must be maintained
                  in trust account to cover outstanding vouchers
                </span>
              </div>
              <div className="text-xs text-content-muted">
                This amount represents the total liability from pending and expired vouchers that could be redeemed at
                any time. It must be backed by corresponding funds in the trust account to ensure PSD-3 §18 compliance.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="text-lg font-bold mb-4">Voucher Lifecycle Stages</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Count</th>
                  <th>Value (NAD)</th>
                  <th>Percentage</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {(vouchers?.lifecycle || []).map((stage) => (
                  <tr key={stage.stage}>
                    <td className="font-bold">{stage.stage}</td>
                    <td className="font-mono">{stage.count.toLocaleString()}</td>
                    <td className="font-semibold">{formatCurrency(stage.value)}</td>
                    <td>
                      <div className="badge badge-primary">{((stage.count / (vouchers?.totalIssued || 1)) * 100).toFixed(1)}%</div>
                    </td>
                    <td className="text-xs text-content-muted">
                      {stage.stage === 'Issued'
                        ? 'Vouchers created by Ketchup'
                        : stage.stage === 'Distributed'
                          ? 'Sent to beneficiaries'
                          : stage.stage === 'Redeemed'
                            ? 'Successfully claimed by beneficiaries'
                            : stage.stage === 'Pending'
                              ? 'Awaiting redemption'
                              : 'Expired/unclaimed'}
                    </td>
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
