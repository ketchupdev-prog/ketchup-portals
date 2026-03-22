/**
 * Security & Fraud Monitoring Types
 * Location: src/lib/types/security.ts
 * Standards: PSD-12 cybersecurity compliance
 */

export type SeverityLevel = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EventStatus = 'success' | 'failed' | 'blocked' | 'pending';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type TwoFactorMethod = 'TOTP' | 'SMS' | 'EMAIL';

export interface SecurityOverview {
  securityScore: {
    overall: number;
    breakdown: {
      twoFactorAdoption: number;
      passwordStrength: number;
      sessionSecurity: number;
      auditLogCoverage: number;
      encryptionStatus: number;
    };
  };
  twoFactorAdoption: {
    enabled: number;
    total: number;
    percentage: number;
  };
  failedLogins: {
    count24h: number;
    threshold: number;
    status: 'normal' | 'warning' | 'critical';
  };
  activeSessions: {
    count: number;
    unique_users: number;
  };
  recentEvents: SecurityEvent[];
  recommendations: SecurityRecommendation[];
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'auth' | 'transaction' | 'config' | 'access' | 'fraud';
  action: string;
  user: string;
  userId?: string;
  ipAddress: string;
  status: EventStatus;
  severity: SeverityLevel;
  details?: string;
  resource?: string;
  location?: string;
}

export interface SecurityRecommendation {
  id: string;
  severity: SeverityLevel;
  title: string;
  description: string;
  actionable: boolean;
  actionUrl?: string;
}

export interface FraudDetectionMetrics {
  stats24h: {
    suspiciousTransactions: number;
    blockedTransactions: number;
    underReview: number;
    falsePositives: number;
    confirmedFraud: number;
    fraudRate: number;
  };
  mlModelPerformance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
    lastUpdated: string;
  };
  riskFactors: RiskFactor[];
  recentDetections: FraudDetection[];
}

export interface RiskFactor {
  id: string;
  name: string;
  weight: number;
  enabled: boolean;
  description: string;
}

export interface FraudDetection {
  id: string;
  timestamp: string;
  transactionId: string;
  userId: string;
  userName?: string;
  amount: number;
  currency: string;
  riskScore: number;
  riskLevel: RiskLevel;
  flags: string[];
  status: 'flagged' | 'blocked' | 'reviewing' | 'approved' | 'fraud';
  assignedTo?: string;
  details?: {
    device?: string;
    location?: string;
    velocity?: number;
    kycStatus?: string;
  };
}

export interface TwoFactorStats {
  overview: {
    totalUsers: number;
    twoFactorEnabled: number;
    twoFactorNotEnabled: number;
    adoptionRate: number;
  };
  byUserType: {
    userType: string;
    total: number;
    enabled: number;
    percentage: number;
    required: boolean;
  }[];
  byMethod: {
    method: TwoFactorMethod;
    count: number;
    percentage: number;
  }[];
  recentEnrollments: {
    timestamp: string;
    userId: string;
    userName: string;
    method: TwoFactorMethod;
  }[];
  exemptions: {
    userId: string;
    userName: string;
    reason: string;
    approvedBy: string;
    expiresAt: string;
  }[];
}

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  userId?: string;
  action?: string;
  resource?: string;
  ipAddress?: string;
  status?: EventStatus;
  severity?: SeverityLevel;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
  filters: AuditLogFilters;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  user: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: EventStatus;
  severity: SeverityLevel;
  details: Record<string, any>;
  userAgent?: string;
  location?: string;
}

export interface SecurityIncident {
  id: string;
  type: string;
  severity: SeverityLevel;
  title: string;
  description: string;
  reportedAt: string;
  reportedBy: string;
  status: IncidentStatus;
  assignedTo?: string;
  deadline?: string;
  bonReported: boolean;
  bonReportedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  timeline: IncidentTimelineEntry[];
  affectedSystems: string[];
  affectedUsers?: number;
}

export interface IncidentTimelineEntry {
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
}

export interface IncidentStats {
  period: string;
  total: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byStatus: {
    open: number;
    investigating: number;
    resolved: number;
    closed: number;
  };
  bonReported: number;
  averageResolutionTime: number;
}

export interface WebSocketSecurityEvent {
  type: 'security_event' | 'fraud_detection' | 'incident_update' | 'system_alert';
  payload: SecurityEvent | FraudDetection | SecurityIncident | SystemAlert;
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  type: 'breach' | 'attack' | 'threshold' | 'compliance';
  severity: SeverityLevel;
  message: string;
  timestamp: string;
  requiresAction: boolean;
  actionUrl?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ExportRequest {
  format: 'CSV' | 'PDF' | 'JSON';
  startDate: string;
  endDate: string;
  filters?: AuditLogFilters;
}
