'use client';

/**
 * Analytics Overview – System metrics, performance, and usage analytics
 */

import { useAnalyticsPolling } from '@/lib/hooks/use-analytics-polling';
import { getSystemMetrics } from '@/lib/api/analytics';
import { MetricCard, AreaChart, HistogramChart, GeoMap } from '@/components/analytics';
import { TrendChart } from '@/components/financial/trend-chart';

export default function AnalyticsOverviewPage() {
  const { data, loading, error, refetch } = useAnalyticsPolling(
    getSystemMetrics,
    { interval: 30000, enabled: true }
  );

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading analytics: {error.message}</span>
        <button onClick={refetch} className="btn btn-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Analytics Overview</h1>
          <p className="text-sm text-content-muted mt-1">System metrics, performance, and usage analytics</p>
        </div>
        <button onClick={refetch} className="btn btn-sm btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="API Requests"
          value={loading ? '...' : data?.systemMetrics.apiRequests.toLocaleString() || '0'}
          change="+12% from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Avg Response Time"
          value={loading ? '...' : `${data?.systemMetrics.avgResponseTime || 0}ms`}
          change="-8% from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Error Rate"
          value={loading ? '...' : `${((data?.systemMetrics.errorRate || 0) * 100).toFixed(2)}%`}
          change="-0.02% from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Active Users"
          value={loading ? '...' : data?.systemMetrics.activeUsers.toLocaleString() || '0'}
          change="+5% from yesterday"
          changeType="positive"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Request Volume (Last 24 Hours)</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <AreaChart
                data={(data?.requestVolume ?? []).map(
                  (r): Record<string, string | number> => ({
                    hour: r.hour,
                    requests: r.requests,
                  })
                )}
                xKey="hour"
                yKey="requests"
                yAxisLabel="Requests"
                color="#3b82f6"
                height={250}
              />
            )}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Response Time Distribution</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-content-muted">P50</p>
                    <p className="text-2xl font-bold">{data?.responseTimeDistribution.p50 || 0}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-content-muted">P95</p>
                    <p className="text-2xl font-bold">{data?.responseTimeDistribution.p95 || 0}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-content-muted">P99</p>
                    <p className="text-2xl font-bold">{data?.responseTimeDistribution.p99 || 0}ms</p>
                  </div>
                </div>
                <HistogramChart
                  data={data?.responseTimeDistribution.histogram || []}
                  xAxisLabel="Response Time (ms)"
                  yAxisLabel="Count"
                  color="#10b981"
                  height={180}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Error Rate Trend (Last 7 Days)</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <TrendChart
                data={(data?.errorRateTrend || []).map(item => ({
                  date: item.date,
                  value: item.rate * 100,
                }))}
                yAxisLabel="Error Rate (%)"
                color="#ef4444"
                height={250}
              />
            )}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Geographic Distribution</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <GeoMap
                data={(data?.geographicDistribution || []).map(item => ({
                  lat: item.lat,
                  lng: item.lng,
                  label: `${item.region}, ${item.country}`,
                  value: item.users,
                }))}
                height="250px"
                center={[-22.5597, 17.0832]}
                zoom={6}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
