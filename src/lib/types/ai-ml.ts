/**
 * AI/ML Type Definitions – Types for SmartPay AI monitoring dashboards
 * Location: src/lib/types/ai-ml.ts
 * Connected to: SmartPay AI Service at /fintech/apps/smartpay-ai
 */

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ============================================================================
// COPILOT PERFORMANCE TYPES
// ============================================================================

export interface CopilotStats {
  conversations24h: number;
  avgDurationMinutes: number;
  resolutionRate: number;
  satisfactionScore: number;
}

export interface AgentPerformance {
  agentName: string;
  agentType: 'BoN Regulatory' | 'Transaction' | 'Analytics' | 'Support' | 'Credit' | 'Fraud';
  invocations24h: number;
  successRate: number;
  avgLatencySeconds: number;
  costPerQuery: number;
}

export interface LLMProviderStats {
  provider: 'DeepSeek' | 'OpenAI' | 'Anthropic' | 'Gemini';
  requestPercentage: number;
  avgCost: number;
  totalRequests24h: number;
}

export interface ConversationDetail {
  id: string;
  timestamp: string;
  query: string;
  agentUsed: string;
  responseTime: number;
  qualityScore: number;
  cost: number;
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;
}

export interface CopilotPerformanceData {
  stats: CopilotStats;
  agentPerformance: AgentPerformance[];
  llmProviders: LLMProviderStats[];
  totalCost24h: number;
  recentConversations: ConversationDetail[];
  errorAnalysis: {
    totalErrors: number;
    errorsByType: Record<string, number>;
  };
}

// ============================================================================
// RAG PERFORMANCE TYPES
// ============================================================================

export interface RAGStats {
  knowledgeBaseSize: number;
  totalChunks: number;
  vectorDimensions: number;
  indexSizeMB: number;
}

export interface RAGQueryMetrics {
  avgRetrievalTimeMs: number;
  avgRelevanceScore: number;
  contextWindowUsage: number;
  hallucinationRate: number;
  targetRetrievalTimeMs: number;
  targetRelevanceScore: number;
  targetContextWindowUsage: number;
  targetHallucinationRate: number;
}

export interface DocumentCoverage {
  documentType: string;
  count: number;
  queries24h: number;
  avgRelevance: number;
}

export interface RAGDocument {
  id: string;
  title: string;
  type: string;
  chunksCount: number;
  uploadedAt: string;
  lastQueried?: string;
  avgRelevance?: number;
}

export interface RAGQueryDebug {
  queryId: string;
  query: string;
  timestamp: string;
  retrievedChunks: Array<{
    chunkId: string;
    documentTitle: string;
    content: string;
    relevanceScore: number;
  }>;
  llmResponse: string;
  executionTimeMs: number;
}

export interface RAGPerformanceData {
  stats: RAGStats;
  queryMetrics: RAGQueryMetrics;
  documentCoverage: DocumentCoverage[];
  documents: RAGDocument[];
  recentQueries: RAGQueryDebug[];
}

// ============================================================================
// ML MODELS TYPES
// ============================================================================

export interface MLModelMetadata {
  modelId: string;
  name: string;
  version: string;
  type: 'Fraud Detection' | 'Credit Scoring' | 'Spending Analysis';
  accuracy: number;
  lastTrained: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRAINING';
  deployed: boolean;
}

export interface FraudDetectionMetrics {
  rocAuc: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataSize: number;
  featureCount: number;
  predictions24h: number;
  highRiskFlagged: number;
  confirmedFraud: number;
  falsePositives: number;
}

export interface CreditScoringMetrics {
  accuracy: number;
  trainingDataSize: number;
  featureCount: number;
  approvedLoansDefaultRate: number;
  targetDefaultRate: number;
}

export interface SpendingAnalysisMetrics {
  silhouetteScore: number;
  trainingDataSize: number;
  clusterCount: number;
  categories: string[];
}

export interface FeatureImportance {
  featureName: string;
  importance: number;
}

export interface ModelDriftAlert {
  modelId: string;
  detectedAt: string;
  driftScore: number;
  affectedFeatures: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface MLModelsData {
  models: MLModelMetadata[];
  fraudDetection?: FraudDetectionMetrics;
  creditScoring?: CreditScoringMetrics;
  spendingAnalysis?: SpendingAnalysisMetrics;
  featureImportance: Record<string, FeatureImportance[]>;
  driftAlerts: ModelDriftAlert[];
}

// ============================================================================
// DUCKDB ANALYTICS TYPES
// ============================================================================

export interface DuckDBStatus {
  databaseSizeMB: number;
  tableCount: number;
  lastSyncAt: string;
  syncStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
  lastError?: string;
}

export interface DuckDBTable {
  tableName: string;
  rowCount: number;
  lastUpdate: string;
  syncFrequency: 'Hourly' | 'Daily' | 'Weekly';
}

export interface ETLSyncHealth {
  dataQualityScore: number;
  lastFailedSync?: string;
  retryCount: number;
  syncHistory: Array<{
    timestamp: string;
    status: 'success' | 'failed';
    duration: number;
    rowsProcessed: number;
  }>;
}

export interface DuckDBQueryResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  executionTimeMs: number;
}

export interface DuckDBAnalyticsData {
  status: DuckDBStatus;
  tables: DuckDBTable[];
  syncHealth: ETLSyncHealth;
}

// ============================================================================
// LLM COST OPTIMIZATION TYPES
// ============================================================================

export interface CostBreakdown {
  total: number;
  byProvider: Record<string, number>;
  byAgent?: Record<string, number>;
}

export interface CostTrend {
  date: string;
  cost: number;
  provider: string;
}

export interface CostOptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSavingsPerMonth: number;
  implemented: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface BudgetStatus {
  currentSpend30d: number;
  projectedMonthly: number;
  budgetLimit: number;
  percentageUsed: number;
  status: 'within_budget' | 'warning' | 'exceeded';
}

export interface QueryCostDistribution {
  costBucket: string;
  count: number;
}

export interface LLMCostData {
  breakdown30d: CostBreakdown;
  dailyTrends: CostTrend[];
  budget: BudgetStatus;
  recommendations: CostOptimizationRecommendation[];
  queryCostDistribution: QueryCostDistribution[];
}

// ============================================================================
// MONITORING & ALERTS TYPES
// ============================================================================

export interface AlertTrigger {
  id: string;
  type: 'model_accuracy' | 'rag_relevance' | 'duckdb_sync' | 'llm_cost' | 'copilot_error';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  triggeredAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface MonitoringConfig {
  pollingIntervals: {
    copilot: number;
    rag: number;
    models: number;
    duckdb: number;
    costs: number;
  };
  alertThresholds: {
    modelAccuracyDrop: number;
    ragRelevanceMin: number;
    llmCostPerDay: number;
    copilotErrorRate: number;
  };
}
