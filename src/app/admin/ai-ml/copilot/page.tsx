'use client';

/**
 * Copilot Performance Dashboard – AI Copilot usage, accuracy, and performance metrics
 * Location: src/app/admin/ai-ml/copilot/page.tsx
 * Connected to: SmartPay AI Service
 */

import { useCopilotPolling } from '@/lib/hooks/use-ai-ml-polling';
import { MetricCard, MetricCardSkeleton, SimplePieChart, ChartSkeleton, StatBar } from '@/components/ai-ml/charts';
import type { CopilotPerformanceData } from '@/lib/types/ai-ml';

export default function CopilotPerformancePage() {
  const { data, loading, error, lastUpdate, refresh } = useCopilotPolling();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Copilot Performance</h1>
          <p className="text-sm text-content-muted mt-1">AI Copilot usage, accuracy & performance metrics</p>
        </div>
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load Copilot performance data: {error}</span>
          <button onClick={refresh} className="btn btn-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Copilot Performance</h1>
          <p className="text-sm text-content-muted mt-1">
            AI Copilot usage, accuracy & performance metrics
            {lastUpdate && (
              <span className="ml-2">
                • Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={refresh} 
          className="btn btn-sm btn-ghost"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </>
      ) : data ? (
        <>
          <CopilotStatsSection data={data} />
          <AgentPerformanceSection data={data} />
          <LLMProviderSection data={data} />
          <ConversationBrowserSection data={data} />
          <ErrorAnalysisSection data={data} />
        </>
      ) : null}
    </div>
  );
}

function CopilotStatsSection({ data }: { data: CopilotPerformanceData }) {
  const { stats } = data;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Conversations (24h)"
        value={stats.conversations24h.toLocaleString()}
        icon="💬"
      />
      <MetricCard
        label="Avg Duration"
        value={`${stats.avgDurationMinutes.toFixed(1)} min`}
        icon="⏱️"
      />
      <MetricCard
        label="Resolution Rate"
        value={`${(stats.resolutionRate * 100).toFixed(0)}%`}
        changeType={stats.resolutionRate >= 0.85 ? 'positive' : 'negative'}
        icon="✅"
      />
      <MetricCard
        label="Satisfaction"
        value={`${stats.satisfactionScore.toFixed(1)}/5`}
        changeType={stats.satisfactionScore >= 4.0 ? 'positive' : 'neutral'}
        icon="⭐"
      />
    </div>
  );
}

function AgentPerformanceSection({ data }: { data: CopilotPerformanceData }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Agent Performance</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Invocations</th>
                <th>Success Rate</th>
                <th>Avg Latency</th>
                <th>Cost/Query</th>
              </tr>
            </thead>
            <tbody>
              {data.agentPerformance.map((agent) => (
                <tr key={agent.agentName}>
                  <td className="font-medium">{agent.agentType}</td>
                  <td>{agent.invocations24h.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${agent.successRate >= 0.9 ? 'badge-success' : 'badge-warning'}`}>
                      {(agent.successRate * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>{agent.avgLatencySeconds.toFixed(2)}s</td>
                  <td>${agent.costPerQuery.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LLMProviderSection({ data }: { data: CopilotPerformanceData }) {
  const pieData = data.llmProviders.map(p => ({
    name: p.provider,
    value: p.requestPercentage,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">LLM Provider Distribution</h2>
          <SimplePieChart data={pieData} height={250} />
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Provider Stats (24h)</h2>
          <div className="space-y-4">
            {data.llmProviders.map((provider) => (
              <div key={provider.provider} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{provider.provider}</span>
                  <span>{provider.requestPercentage.toFixed(1)}% • ${provider.avgCost.toFixed(3)} avg</span>
                </div>
                <StatBar
                  label=""
                  value={provider.totalRequests24h}
                  percentage={provider.requestPercentage}
                  color="primary"
                />
              </div>
            ))}
            <div className="divider"></div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Cost (24h)</span>
              <span className="text-primary">${data.totalCost24h.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationBrowserSection({ data }: { data: CopilotPerformanceData }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Recent Conversations</h2>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Query</th>
                <th>Agent</th>
                <th>Response Time</th>
                <th>Quality</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentConversations.map((conv) => (
                <tr key={conv.id}>
                  <td className="text-xs">
                    {new Date(conv.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="max-w-xs truncate">{conv.query}</td>
                  <td className="text-xs">{conv.agentUsed}</td>
                  <td>{conv.responseTime.toFixed(2)}s</td>
                  <td>
                    <span className={`badge badge-sm ${conv.qualityScore >= 4 ? 'badge-success' : conv.qualityScore >= 3 ? 'badge-warning' : 'badge-error'}`}>
                      {conv.qualityScore.toFixed(1)}/5
                    </span>
                  </td>
                  <td>${conv.cost.toFixed(3)}</td>
                  <td>
                    <span className={`badge badge-sm ${conv.status === 'success' ? 'badge-success' : conv.status === 'failed' ? 'badge-error' : 'badge-warning'}`}>
                      {conv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ErrorAnalysisSection({ data }: { data: CopilotPerformanceData }) {
  const errorData = Object.entries(data.errorAnalysis.errorsByType).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Error Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-content-muted mb-2">
              Total Errors: <span className="font-bold text-base-content">{data.errorAnalysis.totalErrors}</span>
            </p>
            {errorData.length > 0 ? (
              <SimplePieChart data={errorData} height={200} showPercentage={false} />
            ) : (
              <div className="alert alert-success">
                <span>✓ No errors detected in the last 24 hours</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium mb-2">Error Breakdown</h3>
            <div className="space-y-2">
              {errorData.map((error) => (
                <div key={error.name} className="flex justify-between items-center p-2 bg-base-100 rounded">
                  <span className="text-sm">{error.name}</span>
                  <span className="badge badge-error">{error.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
