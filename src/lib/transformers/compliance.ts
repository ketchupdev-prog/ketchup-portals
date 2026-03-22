/**
 * Compliance Data Transformers
 * Transform backend API responses to UI-ready formats
 */

import type { KRIMetrics } from '@/lib/types/compliance';

export interface APIKRIResponse {
  metrics: Array<{
    kri_id: string;
    kri_name: string;
    current_value: number;
    target_value: number;
    unit: string;
    seven_day_trend: number;
    last_updated: string;
  }>;
  timestamp: string;
}

export interface UIKRIMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  trend: number;
  unit: string;
  lastUpdated: Date;
}

export interface UIKRIData {
  metrics: UIKRIMetric[];
  timestamp: Date;
}

export function transformKRIData(apiResponse: APIKRIResponse): UIKRIData {
  return {
    metrics: apiResponse.metrics.map((m) => ({
      id: m.kri_id,
      name: m.kri_name,
      currentValue: m.current_value,
      targetValue: m.target_value,
      status: calculateKRIStatus(m.current_value, m.target_value, m.kri_name),
      trend: m.seven_day_trend,
      unit: m.unit,
      lastUpdated: new Date(m.last_updated),
    })),
    timestamp: new Date(apiResponse.timestamp),
  };
}

function calculateKRIStatus(
  current: number,
  target: number,
  metricName: string
): 'GOOD' | 'WARNING' | 'CRITICAL' {
  const higherIsBetter = [
    'Capital Adequacy Ratio',
    'Reconciliation Success Rate',
    'System Uptime',
  ].some((name) => metricName.includes(name));

  const lowerIsBetter = [
    'Outstanding Complaints',
    'Average Resolution Time',
    'Failed Transactions',
    'Error Rate',
  ].some((name) => metricName.includes(name));

  const percentDiff = ((current - target) / target) * 100;

  if (higherIsBetter) {
    if (current >= target) return 'GOOD';
    if (current >= target * 0.9) return 'WARNING';
    return 'CRITICAL';
  }

  if (lowerIsBetter) {
    if (current <= target) return 'GOOD';
    if (current <= target * 1.1) return 'WARNING';
    return 'CRITICAL';
  }

  if (Math.abs(percentDiff) <= 5) return 'GOOD';
  if (Math.abs(percentDiff) <= 15) return 'WARNING';
  return 'CRITICAL';
}

export interface APIBonReport {
  report_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  due_date: string;
  submitted_at?: string;
  retry_count: number;
  error_message?: string;
  created_at: string;
}

export interface UIBonReport {
  id: string;
  type: string;
  periodStart: Date;
  periodEnd: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'FAILED';
  dueDate: Date;
  submittedAt?: Date;
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
}

export function transformBonReport(apiReport: APIBonReport): UIBonReport {
  return {
    id: apiReport.report_id,
    type: apiReport.report_type,
    periodStart: new Date(apiReport.period_start),
    periodEnd: new Date(apiReport.period_end),
    status: apiReport.status as UIBonReport['status'],
    dueDate: new Date(apiReport.due_date),
    submittedAt: apiReport.submitted_at ? new Date(apiReport.submitted_at) : undefined,
    retryCount: apiReport.retry_count,
    errorMessage: apiReport.error_message,
    createdAt: new Date(apiReport.created_at),
  };
}

export interface APIComplianceAlert {
  alert_id: string;
  alert_type: string;
  severity: string;
  message: string;
  affected_kri?: string;
  created_at: string;
  resolved_at?: string;
  metadata?: Record<string, any>;
}

export interface UIComplianceAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  affectedKRI?: string;
  createdAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
  metadata?: Record<string, any>;
}

export function transformComplianceAlert(apiAlert: APIComplianceAlert): UIComplianceAlert {
  return {
    id: apiAlert.alert_id,
    type: apiAlert.alert_type,
    severity: apiAlert.severity as UIComplianceAlert['severity'],
    message: apiAlert.message,
    affectedKRI: apiAlert.affected_kri,
    createdAt: new Date(apiAlert.created_at),
    resolvedAt: apiAlert.resolved_at ? new Date(apiAlert.resolved_at) : undefined,
    isResolved: !!apiAlert.resolved_at,
    metadata: apiAlert.metadata,
  };
}

export interface APIComplianceEvent {
  event_id: string;
  event_type: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
  priority: string;
  assignee?: string;
}

export interface UIComplianceEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee?: string;
}

export function transformComplianceEvent(apiEvent: APIComplianceEvent): UIComplianceEvent {
  return {
    id: apiEvent.event_id,
    type: apiEvent.event_type,
    title: apiEvent.title,
    description: apiEvent.description,
    startDate: new Date(apiEvent.start_date),
    endDate: apiEvent.end_date ? new Date(apiEvent.end_date) : undefined,
    status: apiEvent.status as UIComplianceEvent['status'],
    priority: apiEvent.priority as UIComplianceEvent['priority'],
    assignee: apiEvent.assignee,
  };
}
