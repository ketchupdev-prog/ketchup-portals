/**
 * AI/ML API Client – Connect to SmartPay AI service
 * Location: src/lib/api/ai-ml.ts
 * Endpoints: /api/v1/ai/*
 */

import { smartPayAI } from './client';
import { handleAPIError, type APIError } from '@/lib/errors/error-handler';
import type {
  RAGPerformanceData,
  MLModelsData,
  DuckDBAnalyticsData,
  LLMCostData,
} from '@/lib/types/ai-ml';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_AI_ML === 'true';

export interface CopilotPerformance {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  successRate: number;
  uptime: number;
  activeUsers: number;
  queriesPerHour: Array<{ hour: string; count: number }>;
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
  timestamp: string;
}

export interface ModelMetrics {
  modelName: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  inferenceTime: number;
  lastTrained: string;
  trainingDataSize: number;
  predictions24h: number;
  status: 'ACTIVE' | 'TRAINING' | 'OFFLINE';
}

export interface FraudDetectionMetrics {
  fraudCasesDetected: number;
  falsePositives: number;
  falseNegatives: number;
  truePositiveRate: number;
  falsePositiveRate: number;
  averageRiskScore: number;
  highRiskTransactions: number;
  modelsActive: number;
  timestamp: string;
}

export interface TransactionRiskScore {
  transactionId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: Array<{
    factor: string;
    weight: number;
    contribution: number;
  }>;
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  confidence: number;
  timestamp: string;
}

export interface PredictiveAnalytics {
  predictions: {
    transactionVolume: Array<{ date: string; predicted: number; confidence: number }>;
    fraudRate: Array<{ date: string; predicted: number; confidence: number }>;
    churnRate: Array<{ date: string; predicted: number; confidence: number }>;
  };
  trends: {
    userGrowth: number;
    transactionGrowth: number;
    revenueGrowth: number;
  };
  recommendations: Array<{
    category: string;
    recommendation: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
  }>;
  timestamp: string;
}

export async function getCopilotPerformance(): Promise<CopilotPerformance> {
  if (USE_MOCK_DATA) {
    return getMockCopilotPerformance();
  }

  try {
    return await smartPayAI.get<CopilotPerformance>('/api/v1/ai/copilot/performance');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/copilot/performance',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getModelMetrics(): Promise<ModelMetrics[]> {
  if (USE_MOCK_DATA) {
    return getMockModelMetrics();
  }

  try {
    return await smartPayAI.get<ModelMetrics[]>('/api/v1/ai/models/metrics');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/models/metrics',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getFraudDetectionMetrics(): Promise<FraudDetectionMetrics> {
  if (USE_MOCK_DATA) {
    return getMockFraudDetectionMetrics();
  }

  try {
    return await smartPayAI.get<FraudDetectionMetrics>('/api/v1/ai/fraud/metrics');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/fraud/metrics',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getTransactionRiskScore(
  transactionId: string
): Promise<TransactionRiskScore> {
  if (USE_MOCK_DATA) {
    return getMockTransactionRiskScore(transactionId);
  }

  try {
    return await smartPayAI.get<TransactionRiskScore>(
      `/api/v1/ai/fraud/score/${transactionId}`
    );
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: `/api/v1/ai/fraud/score/${transactionId}`,
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getPredictiveAnalytics(
  days: number = 30
): Promise<PredictiveAnalytics> {
  if (USE_MOCK_DATA) {
    return getMockPredictiveAnalytics(days);
  }

  try {
    return await smartPayAI.get<PredictiveAnalytics>(
      `/api/v1/ai/analytics/predictions?days=${days}`
    );
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: `/api/v1/ai/analytics/predictions?days=${days}`,
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function trainModel(
  modelName: string,
  config: Record<string, any>
): Promise<{ jobId: string; status: string; estimatedTime: number }> {
  try {
    return await smartPayAI.post<{ jobId: string; status: string; estimatedTime: number }>(
      `/api/v1/ai/models/${modelName}/train`,
      config
    );
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: `/api/v1/ai/models/${modelName}/train`,
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

function getMockCopilotPerformance(): CopilotPerformance {
  return {
    totalQueries: 15234,
    successfulQueries: 14892,
    failedQueries: 342,
    averageResponseTime: 1250,
    successRate: 97.8,
    uptime: 99.5,
    activeUsers: 234,
    queriesPerHour: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: Math.floor(Math.random() * 1000) + 200,
    })),
    topIntents: [
      { intent: 'transaction_status', count: 3421, percentage: 22.4 },
      { intent: 'balance_inquiry', count: 2987, percentage: 19.6 },
      { intent: 'voucher_info', count: 2234, percentage: 14.7 },
      { intent: 'payment_help', count: 1876, percentage: 12.3 },
      { intent: 'account_info', count: 1543, percentage: 10.1 },
    ],
    timestamp: new Date().toISOString(),
  };
}

function getMockModelMetrics(): ModelMetrics[] {
  return [
    {
      modelName: 'fraud-detection-v2',
      version: '2.1.0',
      accuracy: 94.2,
      precision: 92.8,
      recall: 91.5,
      f1Score: 92.1,
      inferenceTime: 45,
      lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      trainingDataSize: 1250000,
      predictions24h: 45678,
      status: 'ACTIVE',
    },
    {
      modelName: 'transaction-classifier',
      version: '1.8.3',
      accuracy: 96.7,
      precision: 95.4,
      recall: 94.9,
      f1Score: 95.1,
      inferenceTime: 32,
      lastTrained: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      trainingDataSize: 890000,
      predictions24h: 98234,
      status: 'ACTIVE',
    },
    {
      modelName: 'churn-predictor',
      version: '1.2.1',
      accuracy: 88.3,
      precision: 87.1,
      recall: 86.2,
      f1Score: 86.6,
      inferenceTime: 78,
      lastTrained: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      trainingDataSize: 450000,
      predictions24h: 12456,
      status: 'ACTIVE',
    },
  ];
}

function getMockFraudDetectionMetrics(): FraudDetectionMetrics {
  return {
    fraudCasesDetected: 234,
    falsePositives: 18,
    falseNegatives: 9,
    truePositiveRate: 96.3,
    falsePositiveRate: 3.7,
    averageRiskScore: 0.23,
    highRiskTransactions: 45,
    modelsActive: 3,
    timestamp: new Date().toISOString(),
  };
}

function getMockTransactionRiskScore(transactionId: string): TransactionRiskScore {
  const riskScore = Math.random() * 100;
  let riskLevel: TransactionRiskScore['riskLevel'];
  let recommendation: TransactionRiskScore['recommendation'];

  if (riskScore < 30) {
    riskLevel = 'LOW';
    recommendation = 'APPROVE';
  } else if (riskScore < 60) {
    riskLevel = 'MEDIUM';
    recommendation = 'APPROVE';
  } else if (riskScore < 80) {
    riskLevel = 'HIGH';
    recommendation = 'REVIEW';
  } else {
    riskLevel = 'CRITICAL';
    recommendation = 'REJECT';
  }

  return {
    transactionId,
    riskScore: Math.round(riskScore * 10) / 10,
    riskLevel,
    factors: [
      { factor: 'Transaction Amount', weight: 0.3, contribution: 12.4 },
      { factor: 'Velocity', weight: 0.25, contribution: 8.2 },
      { factor: 'Location', weight: 0.2, contribution: 5.1 },
      { factor: 'Device Fingerprint', weight: 0.15, contribution: 3.8 },
      { factor: 'Behavioral Pattern', weight: 0.1, contribution: 2.1 },
    ],
    recommendation,
    confidence: Math.random() * 20 + 80,
    timestamp: new Date().toISOString(),
  };
}

function getMockPredictiveAnalytics(days: number): PredictiveAnalytics {
  const predictions = Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    return {
      date: date.toISOString().split('T')[0],
      predicted: Math.floor(Math.random() * 50000) + 100000,
      confidence: Math.random() * 20 + 75,
    };
  });

  return {
    predictions: {
      transactionVolume: predictions,
      fraudRate: predictions.map((p) => ({
        ...p,
        predicted: Math.random() * 2 + 0.5,
      })),
      churnRate: predictions.map((p) => ({
        ...p,
        predicted: Math.random() * 5 + 3,
      })),
    },
    trends: {
      userGrowth: 12.4,
      transactionGrowth: 18.7,
      revenueGrowth: 23.1,
    },
    recommendations: [
      {
        category: 'Fraud Prevention',
        recommendation:
          'Increase monitoring during peak hours (14:00-18:00) when fraud rate spikes',
        impact: 'HIGH',
        confidence: 89.2,
      },
      {
        category: 'User Retention',
        recommendation: 'Target users with declining transaction frequency for re-engagement',
        impact: 'MEDIUM',
        confidence: 76.8,
      },
      {
        category: 'Revenue Optimization',
        recommendation: 'Promote higher-value services to power users during weekends',
        impact: 'HIGH',
        confidence: 82.4,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// ADDITIONAL AI/ML FUNCTIONS (Added for dashboard completeness)
// ============================================================================

// RAG (Retrieval-Augmented Generation) Functions
export async function uploadRAGDocument(
  file: File
): Promise<{ success: boolean; documentId: string; chunksProcessed: number; error?: string }> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      documentId: `doc_${Date.now()}`,
      chunksProcessed: Math.floor(Math.random() * 50) + 10,
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    return await smartPayAI.post('/api/v1/ai/rag/upload', formData);
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/rag/upload',
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function triggerRAGReindex(): Promise<{ success: boolean; jobId: string; error?: string }> {
  if (USE_MOCK_DATA) {
    return { success: true, jobId: `job_${Date.now()}` };
  }

  try {
    return await smartPayAI.post('/api/v1/ai/rag/reindex', {});
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/rag/reindex',
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function debugRAGQuery(
  query: string
): Promise<{ results: Array<{ chunk: string; score: number; metadata: any }> }> {
  if (USE_MOCK_DATA) {
    return {
      results: [
        {
          chunk: 'Sample chunk text related to query',
          score: 0.87,
          metadata: { source: 'doc_123', page: 5 },
        },
        {
          chunk: 'Another relevant chunk',
          score: 0.72,
          metadata: { source: 'doc_456', page: 12 },
        },
      ],
    };
  }

  try {
    return await smartPayAI.post('/api/v1/ai/rag/debug', { query });
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/rag/debug',
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

// LLM Cost Optimization Functions
export async function implementCostOptimization(
  strategy: string
): Promise<{ success: boolean; estimatedSavings: number; error?: string }> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      estimatedSavings: Math.floor(Math.random() * 500) + 100,
    };
  }

  try {
    return await smartPayAI.post('/api/v1/ai/costs/optimize', { strategy });
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/costs/optimize',
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

// DuckDB Analytics Functions
export async function triggerDuckDBSync(): Promise<{ success: boolean; rowsSynced: number; error?: string }> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      rowsSynced: Math.floor(Math.random() * 10000) + 1000,
    };
  }

  try {
    return await smartPayAI.post('/api/v1/ai/duckdb/sync', {});
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/duckdb/sync',
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function executeDuckDBQuery(
  query: string
): Promise<{ success: boolean; rows: Array<any>; executionTime: number; error?: string; data?: Array<any> }> {
  if (USE_MOCK_DATA) {
    const rows = [
      { id: 1, value: 'Sample' },
      { id: 2, value: 'Data' },
    ];
    return {
      success: true,
      rows,
      data: rows,
      executionTime: Math.random() * 100,
    };
  }

  try {
    const res = await smartPayAI.post<{
      success: boolean;
      rows: Array<any>;
      executionTime: number;
    }>('/api/v1/ai/duckdb/query', { query });
    return { ...res, data: res.rows };
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/duckdb/query',
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

// ML Model Management Functions
export async function triggerModelRetrain(
  modelName: string
): Promise<{ success: boolean; jobId: string; estimatedTime: number; error?: string; data?: { jobId: string } }> {
  if (USE_MOCK_DATA) {
    const jobId = `retrain_${Date.now()}`;
    return {
      success: true,
      jobId,
      estimatedTime: Math.floor(Math.random() * 60) + 10,
      data: { jobId },
    };
  }

  try {
    const res = await smartPayAI.post<{
      success: boolean;
      jobId: string;
      estimatedTime: number;
    }>(`/api/v1/ai/models/${modelName}/retrain`, {});
    return { ...res, data: { jobId: res.jobId } };
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: `/api/v1/ai/models/${modelName}/retrain`,
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function rollbackModel(
  modelName: string,
  version: string
): Promise<{ success: boolean; rolledBackTo: string }> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      rolledBackTo: version,
    };
  }

  try {
    return await smartPayAI.post(`/api/v1/ai/models/${modelName}/rollback`, { version });
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: `/api/v1/ai/models/${modelName}/rollback`,
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
  }
}

// Analytics Functions  
export async function getAgentNetworkAnalytics(): Promise<any> {
  if (USE_MOCK_DATA) {
    return {
      totalAgents: 127,
      activeAgents: 98,
      transactionVolume: 145000,
      topAgents: [
        { name: 'Agent A', volume: 15000, revenue: 22500 },
        { name: 'Agent B', volume: 12000, revenue: 18000 },
      ],
    };
  }

  try {
    return await smartPayAI.get('/api/v1/analytics/agents');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/analytics/agents',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getMobileAppAnalytics(): Promise<any> {
  if (USE_MOCK_DATA) {
    return {
      dailyActiveUsers: 5234,
      sessionDuration: 8.5,
      crashRate: 0.2,
      appVersion: '2.1.0',
      topScreens: [
        { screen: 'Dashboard', views: 12000 },
        { screen: 'Transactions', views: 8500 },
      ],
    };
  }

  try {
    return await smartPayAI.get('/api/v1/analytics/mobile-app');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/analytics/mobile-app',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getUSSDAnalytics(): Promise<any> {
  if (USE_MOCK_DATA) {
    return {
      totalSessions: 45000,
      completionRate: 78.5,
      averageSessionDuration: 42,
      topMenus: [
        { menu: 'Balance', count: 15000 },
        { menu: 'Send Money', count: 12000 },
      ],
    };
  }

  try {
    return await smartPayAI.get('/api/v1/analytics/ussd');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/analytics/ussd',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// Admin dashboard aggregates (lib/types/ai-ml) — used by use-ai-ml-polling
// ============================================================================

function mockRAGPerformanceData(): RAGPerformanceData {
  return {
    stats: {
      knowledgeBaseSize: 18420,
      totalChunks: 98234,
      vectorDimensions: 1536,
      indexSizeMB: 420,
    },
    queryMetrics: {
      avgRetrievalTimeMs: 45,
      avgRelevanceScore: 0.87,
      contextWindowUsage: 0.62,
      hallucinationRate: 0.03,
      targetRetrievalTimeMs: 100,
      targetRelevanceScore: 0.8,
      targetContextWindowUsage: 0.75,
      targetHallucinationRate: 0.05,
    },
    documentCoverage: [
      { documentType: 'PSD', count: 42, queries24h: 1200, avgRelevance: 0.91 },
      { documentType: 'Internal Runbooks', count: 18, queries24h: 340, avgRelevance: 0.84 },
    ],
    documents: [
      {
        id: 'doc_1',
        title: 'PSD-12 Cybersecurity',
        type: 'regulation',
        chunksCount: 120,
        uploadedAt: new Date().toISOString(),
        lastQueried: new Date().toISOString(),
        avgRelevance: 0.9,
      },
    ],
    recentQueries: [],
  };
}

function mockMLModelsData(): MLModelsData {
  return {
    models: [
      {
        modelId: 'fraud-v2',
        name: 'Fraud Detection',
        version: '2.1.0',
        type: 'Fraud Detection',
        accuracy: 0.94,
        lastTrained: new Date().toISOString(),
        status: 'ACTIVE',
        deployed: true,
      },
      {
        modelId: 'credit-v1',
        name: 'Credit Scoring',
        version: '1.4.0',
        type: 'Credit Scoring',
        accuracy: 0.88,
        lastTrained: new Date().toISOString(),
        status: 'ACTIVE',
        deployed: true,
      },
    ],
    fraudDetection: {
      rocAuc: 0.94,
      precision: 0.92,
      recall: 0.91,
      f1Score: 0.915,
      trainingDataSize: 1_250_000,
      featureCount: 48,
      predictions24h: 45_678,
      highRiskFlagged: 120,
      confirmedFraud: 34,
      falsePositives: 18,
    },
    featureImportance: {
      fraud: [{ featureName: 'amount_zscore', importance: 0.22 }],
    },
    driftAlerts: [],
  };
}

function mockDuckDBAnalyticsData(): DuckDBAnalyticsData {
  return {
    status: {
      databaseSizeMB: 1280,
      tableCount: 14,
      lastSyncAt: new Date().toISOString(),
      syncStatus: 'HEALTHY',
    },
    tables: [
      {
        tableName: 'transactions_fact',
        rowCount: 2_400_000,
        lastUpdate: new Date().toISOString(),
        syncFrequency: 'Hourly',
      },
    ],
    syncHealth: {
      dataQualityScore: 0.96,
      retryCount: 0,
      syncHistory: [
        { timestamp: new Date().toISOString(), status: 'success', duration: 120, rowsProcessed: 50_000 },
      ],
    },
  };
}

function mockLLMCostData(): LLMCostData {
  return {
    breakdown30d: { total: 4200, byProvider: { OpenAI: 2400, DeepSeek: 1200, Anthropic: 600 } },
    dailyTrends: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      cost: 400 + i * 12,
      provider: 'OpenAI',
    })),
    budget: {
      currentSpend30d: 4200,
      projectedMonthly: 5200,
      budgetLimit: 8000,
      percentageUsed: 52.5,
      status: 'within_budget',
    },
    recommendations: [
      {
        id: 'cache-aggressive',
        title: 'Increase prompt cache TTL',
        description: 'Reduce repeat token cost for support flows.',
        potentialSavingsPerMonth: 800,
        implemented: false,
        priority: 'high',
      },
    ],
    queryCostDistribution: [
      { costBucket: '<$0.01', count: 12000 },
      { costBucket: '$0.01–$0.05', count: 3400 },
    ],
  };
}

export async function getRAGMetrics(): Promise<RAGPerformanceData> {
  if (USE_MOCK_DATA) {
    return mockRAGPerformanceData();
  }
  try {
    return await smartPayAI.get<RAGPerformanceData>('/api/v1/ai/rag/metrics');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/rag/metrics',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getMLModels(): Promise<MLModelsData> {
  if (USE_MOCK_DATA) {
    return mockMLModelsData();
  }
  try {
    return await smartPayAI.get<MLModelsData>('/api/v1/ai/models/dashboard');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/models/dashboard',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getDuckDBStatus(): Promise<DuckDBAnalyticsData> {
  if (USE_MOCK_DATA) {
    return mockDuckDBAnalyticsData();
  }
  try {
    return await smartPayAI.get<DuckDBAnalyticsData>('/api/v1/ai/duckdb/status');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/duckdb/status',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getLLMCosts(_range: { start: Date; end: Date }): Promise<LLMCostData> {
  if (USE_MOCK_DATA) {
    return mockLLMCostData();
  }
  try {
    return await smartPayAI.get<LLMCostData>('/api/v1/ai/costs/summary');
  } catch (error) {
    throw handleAPIError(error, {
      endpoint: '/api/v1/ai/costs/summary',
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
  }
}
