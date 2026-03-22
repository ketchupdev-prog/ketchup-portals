'use client';

/**
 * Transaction Analytics – Transaction flow, conversion metrics, and performance
 */

import { useAnalyticsPolling } from '@/lib/hooks/use-analytics-polling';
import { getTransactionAnalytics, exportAnalytics } from '@/lib/api/analytics';
import { MetricCard, FunnelChart, DonutChart, AreaChart } from '@/components/analytics';
import { TrendChart } from '@/components/financial/trend-chart';
import { useState } from 'react';

export default function TransactionAnalyticsPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    region: '',
    transactionType: '',
  });
  const [exporting, setExporting] = useState(false);

  const { data, loading, error, refetch } = useAnalyticsPolling(
    () => getTransactionAnalytics(filters),
    { interval: 10000, enabled: true }
  );

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      const blob = await exportAnalytics({ ...filters, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-analytics-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export analytics:', err);
      alert('Failed to export analytics');
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading transaction analytics: {error.message}</span>
        <button onClick={refetch} className="btn btn-sm">Retry</button>
      </div>
    );
  }

  const funnelData = data?.funnel ? [
    { label: 'Initiated', value: data.funnel.initiated, percentage: 100 },
    { label: 'Authorized', value: data.funnel.authorized, percentage: (data.funnel.authorized / data.funnel.initiated) * 100 },
    { label: 'Processing', value: data.funnel.processing, percentage: (data.funnel.processing / data.funnel.initiated) * 100 },
    { label: 'Completed', value: data.funnel.completed, percentage: (data.funnel.completed / data.funnel.initiated) * 100 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Transaction Analytics</h1>
          <p className="text-sm text-content-muted mt-1">Transaction flow, conversion metrics & performance</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleExport('csv')} 
            className="btn btn-sm btn-outline"
            disabled={exporting}
          >
            Export CSV
          </button>
          <button 
            onClick={() => handleExport('pdf')} 
            className="btn btn-sm btn-outline"
            disabled={exporting}
          >
            Export PDF
          </button>
          <button onClick={refetch} className="btn btn-sm btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Region</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              >
                <option value="">All Regions</option>
                <option value="khomas">Khomas</option>
                <option value="erongo">Erongo</option>
                <option value="oshana">Oshana</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Transaction Type</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={filters.transactionType}
                onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="send_money">Send Money</option>
                <option value="cash_out">Cash Out</option>
                <option value="bill_payment">Bill Payment</option>
                <option value="airtime">Airtime</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Overall Success Rate"
          value={loading ? '...' : `${((data?.conversionMetrics.overallSuccessRate || 0) * 100).toFixed(1)}%`}
          change="±0% from yesterday"
          changeType="neutral"
          loading={loading}
        />
        <MetricCard
          label="Avg Processing Time"
          value={loading ? '...' : `${data?.conversionMetrics.avgProcessingTime.toFixed(1)}s` || '0s'}
          change="-0.3s from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Authorization Drop-off"
          value={loading ? '...' : `${((data?.conversionMetrics.dropOffPoints.authorization || 0) * 100).toFixed(1)}%`}
          changeType="neutral"
          loading={loading}
        />
        <MetricCard
          label="Processing Drop-off"
          value={loading ? '...' : `${((data?.conversionMetrics.dropOffPoints.processing || 0) * 100).toFixed(1)}%`}
          changeType="neutral"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Transaction Flow Funnel</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <FunnelChart data={funnelData} />
            )}
            <div className="mt-4">
              <p className="text-sm text-content-muted">
                <strong>Peak Hours:</strong> {loading ? '...' : data?.conversionMetrics.peakHours.join(', ')}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Transaction Type Distribution</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <DonutChart
                data={(data?.typeDistribution || []).map(item => ({
                  name: item.type,
                  value: item.percentage,
                }))}
                height={280}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Transaction Volume by Hour</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <AreaChart
                data={(data?.volumeByHour ?? []).map(
                  (r): Record<string, string | number> => ({
                    hour: r.hour,
                    volume: r.volume,
                  })
                )}
                xKey="hour"
                yKey="volume"
                yAxisLabel="Volume (NAD)"
                color="#10b981"
                height={250}
              />
            )}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Success Rate Trend (Last 7 Days)</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <TrendChart
                data={(data?.successRateTrend || []).map(item => ({
                  date: new Date(item.date).toLocaleDateString(),
                  value: item.rate * 100,
                }))}
                yAxisLabel="Success Rate (%)"
                color="#3b82f6"
                height={250}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Transaction Types (Last 24 Hours)</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Count</th>
                  <th>Volume</th>
                  <th>Avg Amount</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}><div className="skeleton h-12 w-full"></div></td></tr>
                ) : (
                  (data?.transactionTypes || []).map((txType) => (
                    <tr key={txType.type}>
                      <td className="font-semibold">{txType.type}</td>
                      <td>{txType.count.toLocaleString()}</td>
                      <td>N${(txType.volume / 1000000).toFixed(1)}M</td>
                      <td>N${txType.avgAmount.toFixed(0)}</td>
                      <td>
                        <span className={txType.successRate >= 0.95 ? 'text-success' : txType.successRate >= 0.90 ? 'text-warning' : 'text-error'}>
                          {(txType.successRate * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
