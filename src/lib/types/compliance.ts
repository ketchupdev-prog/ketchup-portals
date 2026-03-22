/**
 * Compliance Types – KRI metrics, BoN reporting, compliance alerts
 * Location: src/lib/types/compliance.ts
 * Used by: KRI Dashboard, BoN Reporting, Compliance Calendar
 */

export type KRIStatus = 'GOOD' | 'WARNING' | 'CRITICAL';

export interface KRIMetric {
  id: number;
  name: string;
  current: number;
  target: number;
  unit: string;
  status: KRIStatus;
  trend: number[];
  lastUpdated: string;
  description: string;
  dataSource: string;
}

export interface KRIMetrics {
  transactionSuccessRate: KRIMetric;
  systemUptime: KRIMetric;
  twoFAEnforcementRate: KRIMetric;
  fraudDetectionAccuracy: KRIMetric;
  customerComplaintRate: KRIMetric;
  averageResolutionTime: KRIMetric;
  regulatoryBreachCount: KRIMetric;
  securityIncidentCount: KRIMetric;
  dataBackupSuccessRate: KRIMetric;
  apiResponseTimeP95: KRIMetric;
  agentNetworkUptime: KRIMetric;
  trustReconciliationPass: KRIMetric;
}

export type BonReportType = 'INCIDENT' | 'KRI' | 'TRANSACTION' | 'KYC' | 'FRAUD' | 'AUDIT';

export type BonReportStatus = 'PENDING' | 'SUBMITTING' | 'SUBMITTED' | 'FAILED' | 'OVERDUE';

export interface BonReport {
  id: string;
  reportType: BonReportType;
  createdAt: string;
  deadline: string;
  status: BonReportStatus;
  retryCount: number;
  submittedAt?: string;
  errorMessage?: string;
  metadata?: {
    period?: string;
    reportData?: unknown;
  };
}

export interface BonReportQueue {
  reports: BonReport[];
  pendingCount: number;
  overdueCount: number;
}

export type ComplianceAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type ComplianceAlertType = 'KRI_BREACH' | 'BON_OVERDUE' | 'SECURITY_INCIDENT' | 'REGULATORY_VIOLATION' | 'SYSTEM_FAILURE';

export interface ComplianceAlert {
  id: string;
  type: ComplianceAlertType;
  severity: ComplianceAlertSeverity;
  title: string;
  message: string;
  createdAt: string;
  resolvedAt?: string;
  metadata?: {
    kriId?: number;
    reportId?: string;
    incidentId?: string;
  };
}

export interface ComplianceAlertResponse {
  alerts: ComplianceAlert[];
  activeCount: number;
  criticalCount: number;
}

export type ComplianceEventType = 'KRI_REPORT' | 'INCIDENT_REPORT' | 'TRUST_RECONCILIATION' | 'AUDIT_SUBMISSION';

export interface ComplianceEvent {
  id: string;
  title: string;
  type: ComplianceEventType;
  start: Date;
  end: Date;
  allDay: boolean;
  description?: string;
  status?: 'PENDING' | 'COMPLETED' | 'OVERDUE';
}

export interface ExportKRIOptions {
  format: 'CSV' | 'PDF' | 'XML';
  startDate: string;
  endDate: string;
  includeCharts?: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
