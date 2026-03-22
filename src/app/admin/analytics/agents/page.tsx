'use client';

/**
 * Agent Network Analytics – Agent performance, geographic distribution, and leaderboard
 */

import { useAnalyticsPolling } from '@/lib/hooks/use-analytics-polling';
import { getAgentAnalytics } from '@/lib/api/analytics';
import { MetricCard, GeoMap } from '@/components/analytics';
import { BarChart } from '@/components/financial/bar-chart';

export default function AgentNetworkAnalyticsPage() {
  const { data, loading, error, refetch } = useAnalyticsPolling(
    getAgentAnalytics,
    { interval: 300000, enabled: true }
  );

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading agent analytics: {error.message}</span>
        <button onClick={refetch} className="btn btn-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Agent Network Analytics</h1>
          <p className="text-sm text-content-muted mt-1">Agent performance, distribution & metrics</p>
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
          label="Total Agents"
          value={loading ? '...' : data?.totalAgents.toLocaleString() || '0'}
          loading={loading}
        />
        <MetricCard
          label="Active Agents (24h)"
          value={loading ? '...' : data?.activeAgents.toLocaleString() || '0'}
          change={loading ? '...' : `${data?.activePercentage.toFixed(1)}% of total`}
          changeType="neutral"
          loading={loading}
        />
        <MetricCard
          label="Avg Transactions/Agent"
          value={loading ? '...' : data?.avgTransactionsPerAgent.toFixed(1) || '0'}
          change="+0.3 from yesterday"
          changeType="positive"
          loading={loading}
        />
        <MetricCard
          label="Avg Float"
          value={loading ? '...' : `N$${data?.avgFloat.toLocaleString() || '0'}`}
          change="+5% from last week"
          changeType="positive"
          loading={loading}
        />
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">Performance Insight</h2>
          </div>
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>
              Top {data?.topPerformersPercentage || 10}% of agents handle {45}% of total transaction volume
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Geographic Distribution</h2>
            {loading ? (
              <div className="skeleton h-96 w-full"></div>
            ) : (
              <GeoMap
                data={(data?.geographicDistribution || []).map(item => ({
                  lat: item.lat,
                  lng: item.lng,
                  label: item.region,
                  value: item.agentCount,
                }))}
                height="400px"
                center={[-22.5597, 17.0832]}
                zoom={6}
              />
            )}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Transaction Volume by Region</h2>
            {loading ? (
              <div className="skeleton h-96 w-full"></div>
            ) : (
              <BarChart
                data={(data?.geographicDistribution || []).map(item => ({
                  label: item.region,
                  value: item.transactionVolume / 1000000,
                }))}
                yAxisLabel="Volume (M NAD)"
                color="#10b981"
                height={400}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Agent Leaderboard (Top 10)</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agent ID</th>
                  <th>Location</th>
                  <th>Transactions</th>
                  <th>Volume</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><div className="skeleton h-12 w-full"></div></td></tr>
                ) : (
                  (data?.leaderboard || []).map((agent) => (
                    <tr key={agent.agentId}>
                      <td>
                        <div className="flex items-center gap-2">
                          {agent.rank === 1 && <span className="text-2xl">🥇</span>}
                          {agent.rank === 2 && <span className="text-2xl">🥈</span>}
                          {agent.rank === 3 && <span className="text-2xl">🥉</span>}
                          <span className="font-bold">{agent.rank}</span>
                        </div>
                      </td>
                      <td className="font-mono">{agent.agentId}</td>
                      <td>{agent.location}</td>
                      <td>{agent.transactions.toLocaleString()}</td>
                      <td>N${(agent.volume / 1000).toFixed(1)}K</td>
                      <td className="text-success font-semibold">N${agent.commission.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!loading && data?.coverageGaps && data.coverageGaps.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Coverage Gaps</h2>
            <p className="text-sm text-content-muted mb-4">
              Regions with insufficient agent presence
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.coverageGaps.map((gap, index) => (
                <div key={index} className={`alert ${
                  gap.severity === 'high' ? 'alert-error' : 
                  gap.severity === 'medium' ? 'alert-warning' : 
                  'alert-info'
                }`}>
                  <div>
                    <div className="font-bold">{gap.region}</div>
                    <div className="text-sm">
                      Severity: {gap.severity.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Regional Statistics</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Agent Count</th>
                  <th>Transaction Volume</th>
                  <th>Avg Volume/Agent</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4}><div className="skeleton h-12 w-full"></div></td></tr>
                ) : (
                  (data?.geographicDistribution || []).map((region) => (
                    <tr key={region.region}>
                      <td className="font-semibold">{region.region}</td>
                      <td>{region.agentCount.toLocaleString()}</td>
                      <td>N${(region.transactionVolume / 1000000).toFixed(2)}M</td>
                      <td>N${((region.transactionVolume / region.agentCount) / 1000).toFixed(1)}K</td>
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
