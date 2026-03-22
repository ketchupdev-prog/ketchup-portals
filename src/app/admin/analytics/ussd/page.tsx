'use client';

/**
 * USSD Analytics – USSD session performance, menu navigation, and error analysis
 */

import { useAnalyticsPolling } from '@/lib/hooks/use-analytics-polling';
import { getUSSDAnalytics } from '@/lib/api/analytics';
import { MetricCard, DonutChart } from '@/components/analytics';
import { BarChart } from '@/components/financial/bar-chart';

export default function USSDAnalyticsPage() {
  const { data, loading, error, refetch } = useAnalyticsPolling(
    getUSSDAnalytics,
    { interval: 30000, enabled: true }
  );

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading USSD analytics: {error.message}</span>
        <button onClick={refetch} className="btn btn-sm">Retry</button>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  const errorData = data?.errorAnalysis ? [
    { name: 'Timeout', value: data.errorAnalysis.timeout },
    { name: 'Invalid Input', value: data.errorAnalysis.invalidInput },
    { name: 'Service Unavailable', value: data.errorAnalysis.serviceUnavailable },
    { name: 'Network Issues', value: data.errorAnalysis.networkIssues },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">USSD Analytics</h1>
          <p className="text-sm text-content-muted mt-1">USSD session performance, navigation & error tracking</p>
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
          label="Total Sessions (24h)"
          value={loading ? '...' : data?.sessionStats.totalSessions.toLocaleString() || '0'}
          change="+8% from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Avg Session Duration"
          value={loading ? '...' : formatDuration(data?.sessionStats.avgDuration || 0)}
          change="-3s from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Completion Rate"
          value={loading ? '...' : `${((data?.sessionStats.completionRate || 0) * 100).toFixed(1)}%`}
          change="+2% from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Error Rate"
          value={loading ? '...' : `${((data?.sessionStats.errorRate || 0) * 100).toFixed(2)}%`}
          change="-0.5% from yesterday"
          changeType="positive"
          loading={loading}
        />
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">Session Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-base-300 rounded-lg">
              <p className="text-sm text-content-muted">Completed Sessions</p>
              <p className="text-3xl font-bold text-success">
                {loading ? '...' : Math.round((data?.sessionStats.totalSessions || 0) * (data?.sessionStats.completionRate || 0)).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-base-300 rounded-lg">
              <p className="text-sm text-content-muted">Abandoned Sessions</p>
              <p className="text-3xl font-bold text-warning">
                {loading ? '...' : Math.round((data?.sessionStats.totalSessions || 0) * (1 - (data?.sessionStats.completionRate || 0))).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-base-300 rounded-lg">
              <p className="text-sm text-content-muted">Error Sessions</p>
              <p className="text-3xl font-bold text-error">
                {loading ? '...' : Math.round((data?.sessionStats.totalSessions || 0) * (data?.sessionStats.errorRate || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Error Analysis</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <div className="space-y-4">
                <DonutChart data={errorData} height={250} />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Timeout:</span>
                    <span className="font-semibold">{data?.errorAnalysis.timeout}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invalid Input:</span>
                    <span className="font-semibold">{data?.errorAnalysis.invalidInput}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Unavailable:</span>
                    <span className="font-semibold">{data?.errorAnalysis.serviceUnavailable}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Issues:</span>
                    <span className="font-semibold">{data?.errorAnalysis.networkIssues}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Top Menu Paths by Session Count</h2>
            {loading ? (
              <div className="skeleton h-64 w-full"></div>
            ) : (
              <BarChart
                data={(data?.menuNavigation || []).slice(0, 5).map(item => ({
                  label: item.menuPath.split(' → ').pop() || item.menuPath,
                  value: item.sessions,
                }))}
                yAxisLabel="Sessions"
                color="#8b5cf6"
                height={250}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Menu Navigation Details</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Menu Path</th>
                  <th>Sessions</th>
                  <th>Completion Rate</th>
                  <th>Avg Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}><div className="skeleton h-12 w-full"></div></td></tr>
                ) : (
                  (data?.menuNavigation || []).map((menu, index) => (
                    <tr key={index}>
                      <td className="font-mono text-xs max-w-xs truncate" title={menu.menuPath}>
                        {menu.menuPath}
                      </td>
                      <td>{menu.sessions.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <progress 
                            className={`progress ${menu.completion >= 0.8 ? 'progress-success' : menu.completion >= 0.5 ? 'progress-warning' : 'progress-error'} w-20`} 
                            value={menu.completion * 100} 
                            max="100"
                          />
                          <span className="text-sm font-semibold">
                            {(menu.completion * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td>{menu.avgTime}s</td>
                      <td>
                        {menu.completion >= 0.8 ? (
                          <span className="badge badge-success">Good</span>
                        ) : menu.completion >= 0.5 ? (
                          <span className="badge badge-warning">Fair</span>
                        ) : (
                          <span className="badge badge-error">Poor</span>
                        )}
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
          <h2 className="card-title">Optimization Recommendations</h2>
          <div className="space-y-3">
            {!loading && data?.menuNavigation && (
              <>
                {data.menuNavigation.filter(m => m.completion < 0.5).length > 0 && (
                  <div className="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <strong>Low completion paths detected:</strong> Consider simplifying menu flows with completion rates below 50%
                    </span>
                  </div>
                )}
                {data.errorAnalysis.timeout > 30 && (
                  <div className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>High timeout rate ({data.errorAnalysis.timeout}%):</strong> Consider increasing session timeout or optimizing backend response times
                    </span>
                  </div>
                )}
                {data.errorAnalysis.invalidInput > 20 && (
                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>Invalid input rate is high ({data.errorAnalysis.invalidInput}%):</strong> Improve input validation messages and user guidance
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
