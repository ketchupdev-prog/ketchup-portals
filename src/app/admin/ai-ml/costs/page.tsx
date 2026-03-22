'use client';

/**
 * LLM Cost Optimization Dashboard – Cost tracking, trends, and optimization recommendations
 * Location: src/app/admin/ai-ml/costs/page.tsx
 * Connected to: SmartPay AI Service - LLM cost analytics
 */

import { useState } from 'react';
import { useLLMCostsPolling } from '@/lib/hooks/use-ai-ml-polling';
import { implementCostOptimization } from '@/lib/api/ai-ml';
import { MetricCard, MetricCardSkeleton, SimplePieChart, StackedAreaChart, SimpleBarChart } from '@/components/ai-ml/charts';
import type { LLMCostData } from '@/lib/types/ai-ml';

export default function LLMCostsPage() {
  const { data, loading, error, lastUpdate, refresh } = useLLMCostsPolling();
  const [implementing, setImplementing] = useState<string | null>(null);

  const handleImplementRecommendation = async (recommendationId: string) => {
    if (!confirm('Implement this cost optimization recommendation?')) {
      return;
    }

    setImplementing(recommendationId);
    const result = await implementCostOptimization(recommendationId);
    setImplementing(null);

    if (result.success) {
      alert('Optimization implemented successfully');
      refresh();
    } else {
      alert(`Implementation failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">LLM Cost Optimization</h1>
          <p className="text-sm text-content-muted mt-1">Cost tracking & optimization</p>
        </div>
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load cost data: {error}</span>
          <button onClick={refresh} className="btn btn-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">LLM Cost Optimization</h1>
          <p className="text-sm text-content-muted mt-1">
            Cost tracking & optimization recommendations
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
          <CostOverviewSection data={data} />
          <BudgetStatusSection data={data} />
          <CostBreakdownSection data={data} />
          <CostTrendSection data={data} />
          <QueryCostDistributionSection data={data} />
          <OptimizationRecommendationsSection 
            data={data} 
            onImplement={handleImplementRecommendation}
            implementing={implementing}
          />
        </>
      ) : null}
    </div>
  );
}

function CostOverviewSection({ data }: { data: LLMCostData }) {
  const { breakdown30d, budget } = data;
  
  const totalSavings = data.recommendations
    .filter(r => !r.implemented)
    .reduce((sum, r) => sum + r.potentialSavingsPerMonth, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total (30 days)"
        value={`$${breakdown30d.total.toFixed(2)}`}
        icon="💰"
      />
      <MetricCard
        label="Projected Monthly"
        value={`$${budget.projectedMonthly.toFixed(2)}`}
        changeType={budget.status === 'within_budget' ? 'positive' : 'negative'}
        icon="📊"
      />
      <MetricCard
        label="Budget Utilization"
        value={`${budget.percentageUsed.toFixed(0)}%`}
        changeType={budget.percentageUsed < 80 ? 'positive' : budget.percentageUsed < 100 ? 'neutral' : 'negative'}
        icon="🎯"
      />
      <MetricCard
        label="Potential Savings"
        value={`$${totalSavings.toFixed(2)}/mo`}
        changeType="positive"
        icon="💡"
      />
    </div>
  );
}

function BudgetStatusSection({ data }: { data: LLMCostData }) {
  const { budget } = data;
  
  const statusConfig = {
    within_budget: { color: 'success', message: 'Within budget', icon: '✓' },
    warning: { color: 'warning', message: 'Approaching limit', icon: '⚠' },
    exceeded: { color: 'error', message: 'Budget exceeded', icon: '✗' },
  };

  const config = statusConfig[budget.status];

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Budget Status</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Monthly Budget</span>
              <span className={`badge badge-${config.color} badge-lg`}>
                {config.icon} {config.message}
              </span>
            </div>
            <progress 
              className={`progress progress-${config.color} w-full h-4`}
              value={budget.percentageUsed} 
              max="100"
            />
            <div className="flex justify-between text-xs text-content-muted mt-1">
              <span>${budget.currentSpend30d.toFixed(2)} spent</span>
              <span>${budget.budgetLimit.toFixed(2)} limit</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-base-300">
            <div>
              <p className="text-xs text-content-muted">Current (30d)</p>
              <p className="text-lg font-bold">${budget.currentSpend30d.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-content-muted">Projected</p>
              <p className="text-lg font-bold">${budget.projectedMonthly.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-content-muted">Remaining</p>
              <p className="text-lg font-bold">
                ${Math.max(0, budget.budgetLimit - budget.projectedMonthly).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostBreakdownSection({ data }: { data: LLMCostData }) {
  const providerData = Object.entries(data.breakdown30d.byProvider).map(([provider, cost]) => ({
    name: provider,
    value: cost,
  }));

  const agentData = data.breakdown30d.byAgent 
    ? Object.entries(data.breakdown30d.byAgent).map(([agent, cost]) => ({
        name: agent,
        value: cost,
      }))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Cost by Provider (30d)</h2>
          <SimplePieChart data={providerData} height={250} />
          <div className="mt-4 space-y-2">
            {providerData.map((provider) => (
              <div key={provider.name} className="flex justify-between items-center">
                <span className="text-sm">{provider.name}</span>
                <span className="font-medium">
                  ${provider.value.toFixed(2)} ({((provider.value / data.breakdown30d.total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {agentData.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Cost by Agent (30d)</h2>
            <SimplePieChart data={agentData} height={250} />
            <div className="mt-4 space-y-2">
              {agentData.map((agent) => (
                <div key={agent.name} className="flex justify-between items-center">
                  <span className="text-sm">{agent.name}</span>
                  <span className="font-medium">
                    ${agent.value.toFixed(2)} ({((agent.value / data.breakdown30d.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CostTrendSection({ data }: { data: LLMCostData }) {
  const groupedByDate = data.dailyTrends.reduce((acc, trend) => {
    const existing = acc.find(item => item.name === trend.date);
    if (existing) {
      existing[trend.provider] = trend.cost;
    } else {
      acc.push({
        name: trend.date,
        [trend.provider]: trend.cost,
      });
    }
    return acc;
  }, [] as Array<{ name: string; [key: string]: string | number }>);

  const providers = [...new Set(data.dailyTrends.map(t => t.provider))];
  const providerColors: Record<string, string> = {
    DeepSeek: '#3b82f6',
    OpenAI: '#10b981',
    Anthropic: '#f59e0b',
    Gemini: '#ef4444',
  };

  const dataKeys = providers.map(p => ({
    key: p,
    color: providerColors[p] || '#8b5cf6',
    label: p,
  }));

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Cost Trend (30 days)</h2>
        <StackedAreaChart 
          data={groupedByDate} 
          dataKeys={dataKeys}
          height={300}
        />
      </div>
    </div>
  );
}

function QueryCostDistributionSection({ data }: { data: LLMCostData }) {
  const chartData = data.queryCostDistribution.map(bucket => ({
    name: bucket.costBucket,
    value: bucket.count,
  }));

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Query Cost Distribution</h2>
        <p className="text-sm text-content-muted mb-4">
          Distribution of query costs helps identify expensive queries that may need optimization
        </p>
        <SimpleBarChart 
          data={chartData}
          dataKey="value"
          color="#3b82f6"
          height={250}
          xAxisLabel="Cost Bucket"
          yAxisLabel="Query Count"
        />
      </div>
    </div>
  );
}

function OptimizationRecommendationsSection({ 
  data, 
  onImplement,
  implementing 
}: { 
  data: LLMCostData; 
  onImplement: (id: string) => void;
  implementing: string | null;
}) {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const sortedRecommendations = [...data.recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const totalPotentialSavings = data.recommendations
    .filter(r => !r.implemented)
    .reduce((sum, r) => sum + r.potentialSavingsPerMonth, 0);

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title">Cost Optimization Recommendations</h2>
            <p className="text-sm text-content-muted">
              Potential savings: <span className="font-bold text-success">${totalPotentialSavings.toFixed(2)}/month</span>
              {' '}({((totalPotentialSavings / data.breakdown30d.total) * 100).toFixed(1)}% of current spend)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sortedRecommendations.map((rec) => {
            const priorityConfig = {
              high: { color: 'error', icon: '🔴' },
              medium: { color: 'warning', icon: '🟡' },
              low: { color: 'info', icon: '🔵' },
            };
            const config = priorityConfig[rec.priority];

            return (
              <div 
                key={rec.id} 
                className={`p-4 bg-base-100 rounded-lg border-2 ${rec.implemented ? 'border-success opacity-60' : `border-${config.color}`}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{config.icon}</span>
                      <h3 className="font-medium">{rec.title}</h3>
                      <span className={`badge badge-${config.color} badge-sm`}>
                        {rec.priority}
                      </span>
                      {rec.implemented && (
                        <span className="badge badge-success badge-sm">✓ Implemented</span>
                      )}
                    </div>
                    <p className="text-sm text-content-muted mb-2">{rec.description}</p>
                    <p className="text-sm font-medium text-success">
                      💰 Save ${rec.potentialSavingsPerMonth.toFixed(2)}/month
                    </p>
                  </div>
                  {!rec.implemented && (
                    <button 
                      onClick={() => onImplement(rec.id)}
                      className={`btn btn-sm btn-primary ${implementing === rec.id ? 'loading' : ''}`}
                      disabled={implementing !== null}
                    >
                      {implementing === rec.id ? 'Implementing...' : 'Implement'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedRecommendations.length === 0 && (
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No optimization recommendations at this time. Your LLM costs are well optimized!</span>
          </div>
        )}
      </div>
    </div>
  );
}
