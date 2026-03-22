'use client';

/**
 * Mobile App Analytics – SmartPay mobile app usage, performance, and user behavior
 */

import { useAnalyticsPolling } from '@/lib/hooks/use-analytics-polling';
import { getMobileAppAnalytics } from '@/lib/api/analytics';
import { MetricCard, DonutChart } from '@/components/analytics';
import { TrendChart } from '@/components/financial/trend-chart';
import { BarChart } from '@/components/financial/bar-chart';

export default function MobileAppAnalyticsPage() {
  const { data, loading, error, refetch } = useAnalyticsPolling(
    getMobileAppAnalytics,
    { interval: 300000, enabled: true }
  );

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading mobile app analytics: {error.message}</span>
        <button onClick={refetch} className="btn btn-sm">Retry</button>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Mobile App Analytics</h1>
          <p className="text-sm text-content-muted mt-1">SmartPay mobile app usage, performance & user behavior</p>
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
          label="Active Users (Daily)"
          value={loading ? '...' : data?.activeUsers.daily.toLocaleString() || '0'}
          change="+8% from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Active Users (Monthly)"
          value={loading ? '...' : data?.activeUsers.monthly.toLocaleString() || '0'}
          change="+15% from last month"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Avg Session Duration"
          value={loading ? '...' : formatDuration(data?.sessionDuration || 0)}
          change="+12% from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Total Sessions"
          value={loading ? '...' : data?.sessions.total.toLocaleString() || '0'}
          change={loading ? '...' : `${data?.sessions.avgPerUser.toFixed(1)} per user`}
          changeType="neutral"
          loading={loading}
        />
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">User Retention</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-content-muted">Day 1</p>
              <p className="text-3xl font-bold">{loading ? '...' : `${((data?.retention.day1 || 0) * 100).toFixed(0)}%`}</p>
              <div className={`badge ${(data?.retention.day1 || 0) >= 0.8 ? 'badge-success' : 'badge-warning'} mt-2`}>
                {(data?.retention.day1 || 0) >= 0.8 ? 'Excellent' : 'Good'}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-content-muted">Day 7</p>
              <p className="text-3xl font-bold">{loading ? '...' : `${((data?.retention.day7 || 0) * 100).toFixed(0)}%`}</p>
              <div className={`badge ${(data?.retention.day7 || 0) >= 0.6 ? 'badge-success' : 'badge-warning'} mt-2`}>
                {(data?.retention.day7 || 0) >= 0.6 ? 'Excellent' : 'Good'}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-content-muted">Day 30</p>
              <p className="text-3xl font-bold">{loading ? '...' : `${((data?.retention.day30 || 0) * 100).toFixed(0)}%`}</p>
              <div className={`badge ${(data?.retention.day30 || 0) >= 0.4 ? 'badge-success' : 'badge-warning'} mt-2`}>
                {(data?.retention.day30 || 0) >= 0.4 ? 'Excellent' : 'Good'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">User Growth (Last 90 Days)</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <TrendChart
                data={(data?.userGrowth || []).map(item => ({
                  date: new Date(item.date).toLocaleDateString(),
                  value: item.users,
                }))}
                yAxisLabel="Users"
                color="#3b82f6"
                height={250}
              />
            )}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Session Duration Trend (Last 30 Days)</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <TrendChart
                data={(data?.sessionDurationTrend || []).map(item => ({
                  date: new Date(item.date).toLocaleDateString(),
                  value: item.duration / 60,
                }))}
                yAxisLabel="Duration (minutes)"
                color="#10b981"
                height={250}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Device Distribution</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <div className="space-y-4">
                <DonutChart
                  data={[
                    { name: 'Android', value: data?.deviceDistribution.android || 0 },
                    { name: 'iOS', value: data?.deviceDistribution.ios || 0 },
                    { name: 'Tablets', value: data?.deviceDistribution.tablets || 0 },
                  ]}
                  height={200}
                />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-content-muted">Avg Android OS</p>
                    <p className="font-semibold">{data?.deviceDistribution.avgAndroidOs}</p>
                  </div>
                  <div>
                    <p className="text-content-muted">Avg iOS Version</p>
                    <p className="font-semibold">{data?.deviceDistribution.avgIosOs}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Feature Adoption (Top 10)</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <BarChart
                data={(data?.featureAdoption || []).slice(0, 10).map(item => ({
                  label: item.feature,
                  value: item.usage,
                }))}
                yAxisLabel="Usage"
                color="#8b5cf6"
                height={250}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Screen Analytics</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Screen</th>
                  <th>Views</th>
                  <th>Avg Time</th>
                  <th>Bounce Rate</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}><div className="skeleton h-12 w-full"></div></td></tr>
                ) : (
                  (data?.screenAnalytics || []).map((screen) => (
                    <tr key={screen.screen}>
                      <td className="font-semibold">{screen.screen}</td>
                      <td>{screen.views.toLocaleString()}</td>
                      <td>{(screen.avgTime / 60).toFixed(1)} min</td>
                      <td>
                        <span className={screen.bounceRate > 0.2 ? 'text-warning' : 'text-success'}>
                          {(screen.bounceRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        {screen.conversion !== undefined ? (
                          <span className={screen.conversion >= 0.9 ? 'text-success' : 'text-warning'}>
                            {(screen.conversion * 100).toFixed(0)}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Feature Usage Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-content-muted">Biometric Auth</p>
              <p className="text-2xl font-bold">{loading ? '...' : `${((data?.featureUsage.biometricAuth || 0) * 100).toFixed(0)}%`}</p>
              <p className="text-xs text-content-muted">of logins</p>
            </div>
            <div>
              <p className="text-sm text-content-muted">QR Code Scans</p>
              <p className="text-2xl font-bold">{loading ? '...' : data?.featureUsage.qrCodeScans.toLocaleString()}</p>
              <p className="text-xs text-content-muted">last 24h</p>
            </div>
            <div>
              <p className="text-sm text-content-muted">USSD Fallback</p>
              <p className="text-2xl font-bold">{loading ? '...' : data?.featureUsage.ussdFallback.toLocaleString()}</p>
              <p className="text-xs text-content-muted">sessions</p>
            </div>
            <div>
              <p className="text-sm text-content-muted">Offline Mode</p>
              <p className="text-2xl font-bold">{loading ? '...' : data?.featureUsage.offlineTransactions.toLocaleString()}</p>
              <p className="text-xs text-content-muted">transactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
