/**
 * Financial Data Transformers
 * Transform backend financial API responses to UI-ready formats
 */

export interface APIReconciliationStatus {
  reconciliation_date: string;
  wallet_balances_sum: number;
  trust_account_balance: number;
  discrepancy: number;
  status: string;
  tolerance_threshold: number;
  last_reconciliation: string;
  next_scheduled: string;
  notes?: string;
}

export interface UIReconciliationStatus {
  date: Date;
  walletBalancesSum: number;
  trustAccountBalance: number;
  discrepancy: number;
  status: 'PASS' | 'WARNING' | 'CRITICAL';
  tolerance: number;
  lastReconciliation: Date;
  nextScheduled: Date;
  notes?: string;
  discrepancyPercentage: number;
}

export function transformReconciliationStatus(
  apiData: APIReconciliationStatus
): UIReconciliationStatus {
  const discrepancyPercentage =
    apiData.trust_account_balance > 0
      ? (apiData.discrepancy / apiData.trust_account_balance) * 100
      : 0;

  return {
    date: new Date(apiData.reconciliation_date),
    walletBalancesSum: apiData.wallet_balances_sum,
    trustAccountBalance: apiData.trust_account_balance,
    discrepancy: apiData.discrepancy,
    status: apiData.status as UIReconciliationStatus['status'],
    tolerance: apiData.tolerance_threshold,
    lastReconciliation: new Date(apiData.last_reconciliation),
    nextScheduled: new Date(apiData.next_scheduled),
    notes: apiData.notes,
    discrepancyPercentage,
  };
}

export interface APITransaction {
  transaction_id: string;
  timestamp: string;
  transaction_type: string;
  amount: number;
  currency: string;
  from_wallet?: string;
  to_wallet?: string;
  status: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

export interface UITransaction {
  id: string;
  timestamp: Date;
  type: string;
  amount: number;
  currency: string;
  from?: string;
  to?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  failureReason?: string;
  metadata?: Record<string, any>;
  formattedAmount: string;
}

export function transformTransaction(apiTx: APITransaction): UITransaction {
  return {
    id: apiTx.transaction_id,
    timestamp: new Date(apiTx.timestamp),
    type: apiTx.transaction_type,
    amount: apiTx.amount,
    currency: apiTx.currency,
    from: apiTx.from_wallet,
    to: apiTx.to_wallet,
    status: apiTx.status as UITransaction['status'],
    failureReason: apiTx.failure_reason,
    metadata: apiTx.metadata,
    formattedAmount: formatCurrency(apiTx.amount, apiTx.currency),
  };
}

export interface APITransactionMetrics {
  period: string;
  total_volume: number;
  transaction_count: number;
  average_amount: number;
  success_rate: number;
  failed_count: number;
  hourly_volume?: Array<{ hour: string; volume: number; count: number }>;
  type_distribution?: Array<{ type: string; count: number; volume: number }>;
  success_rate_trend?: Array<{ date: string; rate: number }>;
}

export interface UITransactionMetrics {
  period: '24h' | '7d' | '30d';
  totalVolume: number;
  transactionCount: number;
  averageAmount: number;
  successRate: number;
  failedCount: number;
  hourlyVolume?: Array<{ hour: string; volume: number; count: number }>;
  typeDistribution?: Array<{ type: string; count: number; volume: number; percentage: number }>;
  successRateTrend?: Array<{ date: Date; rate: number }>;
}

export function transformTransactionMetrics(
  apiMetrics: APITransactionMetrics
): UITransactionMetrics {
  const typeDistribution = apiMetrics.type_distribution?.map((item) => ({
    type: item.type,
    count: item.count,
    volume: item.volume,
    percentage: (item.count / apiMetrics.transaction_count) * 100,
  }));

  const successRateTrend = apiMetrics.success_rate_trend?.map((item) => ({
    date: new Date(item.date),
    rate: item.rate,
  }));

  return {
    period: apiMetrics.period as UITransactionMetrics['period'],
    totalVolume: apiMetrics.total_volume,
    transactionCount: apiMetrics.transaction_count,
    averageAmount: apiMetrics.average_amount,
    successRate: apiMetrics.success_rate,
    failedCount: apiMetrics.failed_count,
    hourlyVolume: apiMetrics.hourly_volume,
    typeDistribution,
    successRateTrend,
  };
}

export interface APICapitalAdequacy {
  total_emoney_issued: number;
  trust_account_balance: number;
  capital_adequacy_ratio: number;
  minimum_required: number;
  current_cushion: number;
  status: string;
  history?: Array<{
    date: string;
    ratio: number;
    issued: number;
    trust: number;
  }>;
}

export interface UICapitalAdequacy {
  totalEMoneyIssued: number;
  trustAccountBalance: number;
  capitalAdequacyRatio: number;
  minimumRequired: number;
  currentCushion: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  history?: Array<{
    date: Date;
    ratio: number;
    issued: number;
    trust: number;
  }>;
  compliancePercentage: number;
}

export function transformCapitalAdequacy(apiData: APICapitalAdequacy): UICapitalAdequacy {
  const compliancePercentage =
    apiData.minimum_required > 0
      ? (apiData.capital_adequacy_ratio / apiData.minimum_required) * 100
      : 0;

  const history = apiData.history?.map((item) => ({
    date: new Date(item.date),
    ratio: item.ratio,
    issued: item.issued,
    trust: item.trust,
  }));

  return {
    totalEMoneyIssued: apiData.total_emoney_issued,
    trustAccountBalance: apiData.trust_account_balance,
    capitalAdequacyRatio: apiData.capital_adequacy_ratio,
    minimumRequired: apiData.minimum_required,
    currentCushion: apiData.current_cushion,
    status: apiData.status as UICapitalAdequacy['status'],
    history,
    compliancePercentage,
  };
}

export function formatCurrency(amount: number, currency: string = 'NAD'): string {
  const symbol = currency === 'NAD' ? 'N$' : currency;
  return `${symbol}${amount.toLocaleString('en-NA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
