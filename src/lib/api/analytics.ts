/**
 * Analytics API client for SmartPay backend integration
 * Location: src/lib/api/analytics.ts
 */

const SMARTPAY_API_BASE = process.env.NEXT_PUBLIC_SMARTPAY_BACKEND_URL || 'http://localhost:8000';

export interface SystemMetrics {
  apiRequests: number;
  avgResponseTime: number;
  errorRate: number;
  activeUsers: number;
  timestamp: string;
}

export interface RequestVolumePoint {
  hour: string;
  requests: number;
}

export interface ResponseTimeDistribution {
  p50: number;
  p95: number;
  p99: number;
  histogram: { bucket: string; count: number }[];
}

export interface ErrorRatePoint {
  date: string;
  rate: number;
}

export interface GeographicData {
  country: string;
  region: string;
  users: number;
  lat: number;
  lng: number;
}

export interface AnalyticsOverviewData {
  systemMetrics: SystemMetrics;
  requestVolume: RequestVolumePoint[];
  responseTimeDistribution: ResponseTimeDistribution;
  errorRateTrend: ErrorRatePoint[];
  geographicDistribution: GeographicData[];
}

export interface ComponentStatus {
  component: string;
  status: 'operational' | 'degraded' | 'down';
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  lastCheck: string;
}

export interface IncidentRecord {
  id: string;
  timestamp: string;
  component: string;
  duration: number;
  description: string;
  status: 'resolved' | 'investigating' | 'ongoing';
}

export interface UptimeMetrics {
  currentStatus: 'online' | 'degraded' | 'offline';
  currentUptime: number;
  target: number;
  compliant: boolean;
  lastIncident?: {
    timestamp: string;
    reason: string;
    duration: number;
  };
  nextMaintenance?: {
    scheduled: string;
    window: string;
  };
  components: ComponentStatus[];
  incidents: IncidentRecord[];
  healthCheckHistory: { timestamp: string; uptime: number }[];
}

export interface MobileAppAnalytics {
  activeUsers: {
    daily: number;
    monthly: number;
  };
  sessions: {
    total: number;
    avgPerUser: number;
  };
  sessionDuration: number;
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  screenAnalytics: {
    screen: string;
    views: number;
    avgTime: number;
    bounceRate: number;
    conversion?: number;
  }[];
  featureUsage: {
    biometricAuth: number;
    qrCodeScans: number;
    ussdFallback: number;
    offlineTransactions: number;
  };
  deviceDistribution: {
    android: number;
    ios: number;
    tablets: number;
    avgAndroidOs: string;
    avgIosOs: string;
  };
  userGrowth: { date: string; users: number }[];
  featureAdoption: { feature: string; usage: number }[];
  sessionDurationTrend: { date: string; duration: number }[];
}

export interface TransactionAnalytics {
  funnel: {
    initiated: number;
    authorized: number;
    processing: number;
    completed: number;
  };
  conversionMetrics: {
    overallSuccessRate: number;
    dropOffPoints: {
      authorization: number;
      processing: number;
    };
    avgProcessingTime: number;
    peakHours: string[];
  };
  transactionTypes: {
    type: string;
    count: number;
    volume: number;
    avgAmount: number;
    successRate: number;
  }[];
  volumeByHour: { hour: string; volume: number }[];
  successRateTrend: { date: string; rate: number }[];
  typeDistribution: { type: string; percentage: number }[];
}

export interface AgentAnalytics {
  totalAgents: number;
  activeAgents: number;
  activePercentage: number;
  topPerformersPercentage: number;
  avgTransactionsPerAgent: number;
  avgFloat: number;
  leaderboard: {
    rank: number;
    agentId: string;
    location: string;
    transactions: number;
    volume: number;
    commission: number;
  }[];
  geographicDistribution: {
    region: string;
    agentCount: number;
    transactionVolume: number;
    lat: number;
    lng: number;
  }[];
  coverageGaps: {
    region: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}

export interface USSDAnalytics {
  sessionStats: {
    totalSessions: number;
    avgDuration: number;
    completionRate: number;
    errorRate: number;
  };
  menuNavigation: {
    menuPath: string;
    sessions: number;
    completion: number;
    avgTime: number;
  }[];
  errorAnalysis: {
    timeout: number;
    invalidInput: number;
    serviceUnavailable: number;
    networkIssues: number;
  };
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  region?: string;
  transactionType?: string;
}

export async function getSystemMetrics(): Promise<AnalyticsOverviewData> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/analytics/system`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch system metrics: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getUptimeMetrics(): Promise<UptimeMetrics> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/analytics/uptime`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch uptime metrics: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getMobileAppAnalytics(): Promise<MobileAppAnalytics> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/analytics/mobile-app`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch mobile app analytics: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getTransactionAnalytics(filters?: AnalyticsFilters): Promise<TransactionAnalytics> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.region) params.append('region', filters.region);
  if (filters?.transactionType) params.append('transactionType', filters.transactionType);
  
  const url = `${SMARTPAY_API_BASE}/api/v1/admin/analytics/transactions${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch transaction analytics: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getAgentAnalytics(): Promise<AgentAnalytics> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/analytics/agents`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch agent analytics: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getUSSDAnalytics(): Promise<USSDAnalytics> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/analytics/ussd`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch USSD analytics: ${response.statusText}`);
  }
  
  return response.json();
}

export async function exportAnalytics(filters: AnalyticsFilters & { format: 'csv' | 'pdf' }): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.region) params.append('region', filters.region);
  if (filters.transactionType) params.append('transactionType', filters.transactionType);
  params.append('format', filters.format);
  
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/analytics/export?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to export analytics: ${response.statusText}`);
  }
  
  return response.blob();
}

export async function generateSLAReport(month: string): Promise<Blob> {
  const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/analytics/sla-report?month=${month}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate SLA report: ${response.statusText}`);
  }
  
  return response.blob();
}
