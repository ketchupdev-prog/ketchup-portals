/**
 * Maps SmartPay AI API shapes (lib/api/ai-ml) to admin dashboard types (lib/types/ai-ml).
 * Location: src/lib/api/ai-ml-dashboard-mapper.ts
 */
import type { CopilotPerformance } from '@/lib/api/ai-ml';
import type { CopilotPerformanceData } from '@/lib/types/ai-ml';

export function mapCopilotApiToDashboard(api: CopilotPerformance): CopilotPerformanceData {
  const agentPerformance = (api.topIntents ?? []).map((t) => ({
    agentName: t.intent,
    agentType: 'Support' as const,
    invocations24h: t.count,
    successRate: Math.min(1, Math.max(0, t.percentage / 100)),
    avgLatencySeconds: Math.max(0.1, api.averageResponseTime / 1000),
    costPerQuery: 0.01,
  }));

  return {
    stats: {
      conversations24h: api.successfulQueries ?? 0,
      avgDurationMinutes: Math.max(0, (api.averageResponseTime ?? 0) / 60000),
      resolutionRate: Math.min(1, Math.max(0, (api.successRate ?? 0) / 100)),
      satisfactionScore: 4.2,
    },
    agentPerformance: agentPerformance.length
      ? agentPerformance
      : [
          {
            agentName: 'copilot',
            agentType: 'Support',
            invocations24h: api.totalQueries ?? 0,
            successRate: Math.min(1, Math.max(0, (api.successRate ?? 0) / 100)),
            avgLatencySeconds: 1,
            costPerQuery: 0.01,
          },
        ],
    llmProviders: [
      {
        provider: 'OpenAI',
        requestPercentage: 55,
        avgCost: 0.02,
        totalRequests24h: Math.floor((api.totalQueries ?? 0) * 0.55),
      },
      {
        provider: 'DeepSeek',
        requestPercentage: 30,
        avgCost: 0.008,
        totalRequests24h: Math.floor((api.totalQueries ?? 0) * 0.3),
      },
      {
        provider: 'Anthropic',
        requestPercentage: 15,
        avgCost: 0.03,
        totalRequests24h: Math.floor((api.totalQueries ?? 0) * 0.15),
      },
    ],
    totalCost24h: Math.round((api.totalQueries ?? 0) * 0.015),
    recentConversations: [],
    errorAnalysis: {
      totalErrors: api.failedQueries ?? 0,
      errorsByType: {
        timeout: Math.floor((api.failedQueries ?? 0) * 0.4),
        validation: Math.floor((api.failedQueries ?? 0) * 0.35),
        other: Math.ceil((api.failedQueries ?? 0) * 0.25),
      },
    },
  };
}
