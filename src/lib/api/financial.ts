/**
 * SmartPay Backend Financial API Integration
 * Connects Ketchup Portals to SmartPay backend for:
 * - Trust account reconciliation (PSD-3 §18)
 * - Transaction monitoring
 * - Capital adequacy tracking
 * - Voucher financial metrics
 */

const SMARTPAY_API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_SMARTPAY_BACKEND_URL || 'http://localhost:8080'
    : process.env.SMARTPAY_BACKEND_URL || 'http://localhost:8080';

export interface ReconciliationStatus {
  date: string;
  walletBalancesSum: number;
  trustAccountBalance: number;
  discrepancy: number;
  status: 'PASS' | 'WARNING' | 'CRITICAL';
  tolerance: number;
  lastReconciliation: string;
  nextScheduled: string;
  notes?: string;
}

export interface ReconciliationHistory {
  date: string;
  walletSum: number;
  trustBalance: number;
  discrepancy: number;
  status: 'PASS' | 'WARNING' | 'CRITICAL';
  notes?: string;
}

export interface TransactionMetrics {
  period: '24h' | '7d' | '30d';
  totalVolume: number;
  transactionCount: number;
  averageAmount: number;
  successRate: number;
  failedCount: number;
  hourlyVolume?: Array<{ hour: string; volume: number; count: number }>;
  typeDistribution?: Array<{ type: string; count: number; volume: number }>;
  successRateTrend?: Array<{ date: string; rate: number }>;
  topAgents?: Array<{ agentId: string; volume: number; count: number }>;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'send-money' | 'cash-out' | 'airtime' | 'bills' | 'all';
  status?: 'success' | 'failed' | 'pending' | 'all';
  minAmount?: number;
  maxAmount?: number;
  agentId?: string;
  limit?: number;
  offset?: number;
}

export interface Transaction {
  id: string;
  timestamp: string;
  type: string;
  amount: number;
  currency: string;
  from?: string;
  to?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  failureReason?: string;
}

export interface CapitalAdequacy {
  totalEMoneyIssued: number;
  trustAccountBalance: number;
  capitalAdequacyRatio: number;
  minimumRequired: number;
  currentCushion: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  history?: Array<{ date: string; ratio: number; issued: number; trust: number }>;
}

export interface VoucherFinancials {
  totalIssued: number;
  totalValue: number;
  redeemedCount: number;
  redeemedValue: number;
  pendingCount: number;
  pendingValue: number;
  expiredCount: number;
  expiredValue: number;
  averageRedemptionDays: number;
  liabilityOutstanding: number;
  floatRequired: number;
  lifecycle?: Array<{ stage: string; count: number; value: number }>;
}

export async function getReconciliationStatus(): Promise<ReconciliationStatus> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/compliance/reconciliation/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reconciliation status: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || data;
}

export async function getReconciliationHistory(days: number = 30): Promise<ReconciliationHistory[]> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/compliance/reconciliation/history?days=${days}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reconciliation history: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || data;
}

export async function triggerReconciliation(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/compliance/reconciliation/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger reconciliation: ${response.statusText}`);
  }
  return response.json();
}

export async function getTransactionMetrics(filters: TransactionFilters): Promise<TransactionMetrics> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
  if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
  if (filters.agentId) params.append('agentId', filters.agentId);

  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/financial/transactions/metrics?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transaction metrics: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || data;
}

export async function getTransactionFeed(filters: TransactionFilters): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);

  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/financial/transactions/feed?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transaction feed: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || data;
}

export async function getCapitalAdequacy(): Promise<CapitalAdequacy> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/financial/capital`);
  if (!response.ok) {
    throw new Error(`Failed to fetch capital adequacy: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || data;
}

export async function getVoucherFinancials(): Promise<VoucherFinancials> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/financial/vouchers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch voucher financials: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data || data;
}

export async function exportReconciliationReport(format: 'pdf' | 'csv', date?: string): Promise<Blob> {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  params.append('format', format);

  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/financial/reconciliation/export?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to export reconciliation report: ${response.statusText}`);
  }
  return response.blob();
}

export async function exportTransactions(filters: TransactionFilters): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);

  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/financial/transactions/export?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to export transactions: ${response.statusText}`);
  }
  return response.blob();
}

export function formatCurrency(amount: number, currency: string = 'NAD'): string {
  const symbol = currency === 'NAD' ? 'N$' : currency;
  return `${symbol}${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
