'use client';

import { useState } from 'react';
import { usePolling } from '@/hooks/use-polling';
import {
  getTransactionMetrics,
  getTransactionFeed,
  exportTransactions,
  formatCurrency,
  formatNumber,
  type TransactionFilters,
} from '@/lib/api/financial';
import { CustomBarChart } from '@/components/financial/bar-chart';
import { CustomPieChart } from '@/components/financial/pie-chart';
import { TrendChart } from '@/components/financial/trend-chart';
import { downloadPDF } from '@/lib/export-pdf';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    limit: 50,
  });

  const { data: metrics, loading: metricsLoading } = usePolling({
    fetcher: () => getTransactionMetrics({ ...filters, startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }),
    interval: 30000,
  });

  const { data: feed, loading: feedLoading } = usePolling({
    fetcher: () => getTransactionFeed(filters),
    interval: 5000,
  });

  const handleExport = async () => {
    try {
      const blob = await exportTransactions(filters);
      downloadPDF(blob, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (metricsLoading || feedLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Transaction Monitoring</h1>
          <p className="text-sm text-content-muted mt-1">Real-time transaction monitoring and analytics</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline btn-sm">
          📥 Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">24h Volume</h3>
            <p className="text-3xl font-bold text-primary">{formatCurrency(metrics?.totalVolume || 0)}</p>
            <p className="text-xs text-content-muted mt-1">Total transaction value</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-success/20 to-success/5 border border-success/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">Count</h3>
            <p className="text-3xl font-bold text-success">{formatNumber(metrics?.transactionCount || 0)}</p>
            <p className="text-xs text-content-muted mt-1">Total transactions</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-info/20 to-info/5 border border-info/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">Average</h3>
            <p className="text-3xl font-bold text-info">{formatCurrency(metrics?.averageAmount || 0)}</p>
            <p className="text-xs text-content-muted mt-1">Per transaction</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">Success Rate</h3>
            <p className="text-3xl font-bold text-warning">{((metrics?.successRate || 0) * 100).toFixed(1)}%</p>
            <p className="text-xs text-content-muted mt-1">Transaction success</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-error/20 to-error/5 border border-error/30">
          <div className="card-body">
            <h3 className="text-xs text-content-muted uppercase tracking-wide">Failed</h3>
            <p className="text-3xl font-bold text-error">{metrics?.failedCount || 0}</p>
            <p className="text-xs text-content-muted mt-1">Failed transactions</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="text-lg font-bold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Transaction Type</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={filters.type || 'all'}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              >
                <option value="all">All Types</option>
                <option value="send-money">Send Money</option>
                <option value="cash-out">Cash Out</option>
                <option value="airtime">Airtime</option>
                <option value="bills">Bills</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={filters.status || 'all'}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Min Amount (NAD)</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) => setFilters({ ...filters, minAmount: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Max Amount (NAD)</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm"
                placeholder="∞"
                value={filters.maxAmount || ''}
                onChange={(e) => setFilters({ ...filters, maxAmount: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">Hourly Volume (Last 24h)</h3>
            <CustomBarChart
              data={(metrics?.hourlyVolume || []).map((h) => ({ label: h.hour, value: h.volume }))}
              yAxisLabel="Volume (NAD)"
              color="#3b82f6"
              height={250}
            />
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">Transaction Type Distribution</h3>
            <CustomPieChart
              data={(metrics?.typeDistribution || []).map((t) => ({ name: t.type, value: t.count }))}
              height={250}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">7-Day Success Rate Trend</h3>
            <TrendChart
              data={(metrics?.successRateTrend || []).map((t) => ({ date: t.date, value: t.rate * 100 }))}
              yAxisLabel="Success Rate (%)"
              color="#10b981"
              height={250}
            />
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="text-lg font-bold mb-4">Top Agents by Volume</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Agent ID</th>
                    <th>Volume</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics?.topAgents || []).slice(0, 10).map((agent, idx) => (
                    <tr key={agent.agentId}>
                      <td className="font-bold">{idx + 1}</td>
                      <td className="font-mono">{agent.agentId}</td>
                      <td className="font-semibold text-primary">{formatCurrency(agent.volume)}</td>
                      <td className="text-content-muted">{agent.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Live Transaction Feed</h2>
            <div className="badge badge-success badge-sm gap-1">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              Live (5s refresh)
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>From → To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(feed || []).map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-mono text-xs">{new Date(tx.timestamp).toLocaleTimeString('en-NA')}</td>
                    <td className="font-mono text-xs">{tx.id}</td>
                    <td className="text-sm">{tx.type}</td>
                    <td className="font-semibold">{formatCurrency(tx.amount)}</td>
                    <td className="text-xs font-mono">
                      {tx.from && tx.to ? `${tx.from} → ${tx.to}` : tx.from || tx.to || '-'}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${tx.status === 'SUCCESS' ? 'badge-success' : tx.status === 'FAILED' ? 'badge-error' : 'badge-warning'}`}
                      >
                        {tx.status === 'SUCCESS' ? '✓' : tx.status === 'FAILED' ? '❌' : '⏳'} {tx.status}
                      </span>
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
