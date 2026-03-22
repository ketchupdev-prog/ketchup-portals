/**
 * Security API Client – Connect to SmartPay backend security endpoints
 * Location: src/lib/api/security.ts
 * Standards: PSD-12 cybersecurity compliance
 * Endpoints: /api/v1/admin/security/*
 */

import { smartPayAPI } from './client';
import { handleAPIError } from '@/lib/errors/error-handler';
import type {
  SecurityOverview,
  FraudDetectionMetrics,
  TwoFactorStats,
  AuditLogFilters,
  AuditLogResponse,
  SecurityIncident,
  IncidentStats,
  APIResponse,
  ExportRequest,
} from '@/lib/types/security';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_SECURITY === 'true';

/** Base URL for rare raw `fetch` (e.g. blob export); prefer `smartPayAPI` methods when possible. */
const SMARTPAY_API_BASE = smartPayAPI.getBaseURL();

async function wrapAPICall<T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string = 'GET'
): Promise<APIResponse<T>> {
  try {
    const data = await apiCall();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const apiError = handleAPIError(error, { endpoint, method, timestamp: new Date().toISOString() });
    return {
      success: false,
      error: apiError.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get security overview metrics including security score, 2FA adoption, failed logins
 */
export async function getSecurityOverview(): Promise<APIResponse<SecurityOverview>> {
  return wrapAPICall(
    () => smartPayAPI.get<SecurityOverview>('/api/v1/admin/security/overview'),
    '/api/v1/admin/security/overview'
  );
}

/**
 * Get fraud detection metrics including ML model performance and recent detections
 */
export async function getFraudDetectionMetrics(): Promise<APIResponse<FraudDetectionMetrics>> {
  return wrapAPICall(
    () => smartPayAPI.get<FraudDetectionMetrics>('/api/v1/admin/security/fraud'),
    '/api/v1/admin/security/fraud'
  );
}

/**
 * Get detailed fraud detection by ID
 */
export async function getFraudDetectionById(detectionId: string): Promise<APIResponse<any>> {
  return wrapAPICall(
    () => smartPayAPI.get(`/api/v1/admin/security/fraud/${detectionId}`),
    `/api/v1/admin/security/fraud/${detectionId}`
  );
}

/**
 * Update fraud detection status (approve, reject, flag)
 */
export async function updateFraudDetectionStatus(
  detectionId: string,
  status: 'approved' | 'fraud' | 'reviewing',
  notes?: string
): Promise<APIResponse<{ success: boolean }>> {
  return wrapAPICall(
    () => smartPayAPI.post<{ success: boolean }>(
      `/api/v1/admin/security/fraud/${detectionId}/status`,
      { status, notes }
    ),
    `/api/v1/admin/security/fraud/${detectionId}/status`,
    'POST'
  );
}

/**
 * Get 2FA statistics including adoption rates by user type
 */
export async function get2FAStats(): Promise<APIResponse<TwoFactorStats>> {
  return wrapAPICall(
    () => smartPayAPI.get<TwoFactorStats>('/api/v1/admin/security/2fa'),
    '/api/v1/admin/security/2fa'
  );
}

/**
 * Enforce 2FA for specific user or user group
 */
export async function enforce2FA(userId?: string, userType?: string): Promise<APIResponse<{ success: boolean }>> {
  return wrapAPICall(
    () => smartPayAPI.post<{ success: boolean }>('/api/v1/admin/security/2fa/enforce', { userId, userType }),
    '/api/v1/admin/security/2fa/enforce',
    'POST'
  );
}

/**
 * Send bulk 2FA enrollment reminder campaign
 */
export async function send2FAReminderCampaign(userType?: string): Promise<APIResponse<{ sent: number }>> {
  return wrapAPICall(
    () => smartPayAPI.post<{ sent: number }>('/api/v1/admin/security/2fa/remind', { userType }),
    '/api/v1/admin/security/2fa/remind',
    'POST'
  );
}

/**
 * Add 2FA exemption with justification
 */
export async function add2FAExemption(
  userId: string,
  reason: string,
  expiresAt: string
): Promise<APIResponse<{ success: boolean }>> {
  return wrapAPICall(
    () =>
      smartPayAPI.post<{ success: boolean }>('/api/v1/admin/security/2fa/exemptions', {
        userId,
        reason,
        expiresAt,
      }),
    '/api/v1/admin/security/2fa/exemptions',
    'POST'
  );
}

/**
 * Get audit logs with filters and search
 */
export async function getAuditLogs(filters: AuditLogFilters): Promise<APIResponse<AuditLogResponse>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const q = params.toString();
  return wrapAPICall(
    () => smartPayAPI.get<AuditLogResponse>(`/api/v1/admin/security/audit?${q}`),
    '/api/v1/admin/security/audit'
  );
}

/**
 * Export audit logs to CSV/PDF format
 */
export async function exportAuditLogs(request: ExportRequest): Promise<Blob | null> {
  try {
    const params = new URLSearchParams({
      format: request.format,
      startDate: request.startDate,
      endDate: request.endDate,
    });

    if (request.filters) {
      Object.entries(request.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${SMARTPAY_API_BASE}/api/v1/admin/security/audit/export?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error(`Export failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error('Export error:', error);
    return null;
  }
}

/**
 * Get active security incidents
 */
export async function getSecurityIncidents(status?: string): Promise<APIResponse<SecurityIncident[]>> {
  const endpoint = status
    ? `/api/v1/admin/security/incidents?status=${encodeURIComponent(status)}`
    : '/api/v1/admin/security/incidents';
  return wrapAPICall(() => smartPayAPI.get<SecurityIncident[]>(endpoint), endpoint);
}

/**
 * Get incident statistics for a period
 */
export async function getIncidentStats(period: string = '30d'): Promise<APIResponse<IncidentStats>> {
  return wrapAPICall(
    () =>
      smartPayAPI.get<IncidentStats>(
        `/api/v1/admin/security/incidents/stats?period=${encodeURIComponent(period)}`
      ),
    '/api/v1/admin/security/incidents/stats'
  );
}

/**
 * Get incident by ID
 */
export async function getIncidentById(incidentId: string): Promise<APIResponse<SecurityIncident>> {
  return wrapAPICall(
    () => smartPayAPI.get<SecurityIncident>(`/api/v1/admin/security/incidents/${incidentId}`),
    `/api/v1/admin/security/incidents/${incidentId}`
  );
}

/**
 * Create new security incident
 */
export async function createIncident(incident: {
  type: string;
  severity: string;
  title: string;
  description: string;
  affectedSystems: string[];
}): Promise<APIResponse<SecurityIncident>> {
  return wrapAPICall(
    () => smartPayAPI.post<SecurityIncident>('/api/v1/admin/security/incidents', incident),
    '/api/v1/admin/security/incidents',
    'POST'
  );
}

/**
 * Update incident status
 */
export async function updateIncidentStatus(
  incidentId: string,
  status: string,
  notes?: string
): Promise<APIResponse<{ success: boolean }>> {
  return wrapAPICall(
    () =>
      smartPayAPI.post<{ success: boolean }>(
        `/api/v1/admin/security/incidents/${incidentId}/status`,
        { status, notes }
      ),
    `/api/v1/admin/security/incidents/${incidentId}/status`,
    'POST'
  );
}

/**
 * Report incident to Bank of Namibia
 */
export async function reportIncidentToBoN(
  incidentId: string
): Promise<APIResponse<{ success: boolean; submittedAt: string }>> {
  return wrapAPICall(
    () =>
      smartPayAPI.post<{ success: boolean; submittedAt: string }>(
        `/api/v1/admin/security/incidents/${incidentId}/report-bon`,
        {}
      ),
    `/api/v1/admin/security/incidents/${incidentId}/report-bon`,
    'POST'
  );
}

/**
 * Add timeline entry to incident
 */
export async function addIncidentTimelineEntry(
  incidentId: string,
  action: string,
  details: string
): Promise<APIResponse<{ success: boolean }>> {
  return wrapAPICall(
    () =>
      smartPayAPI.post<{ success: boolean }>(
        `/api/v1/admin/security/incidents/${incidentId}/timeline`,
        { action, details }
      ),
    `/api/v1/admin/security/incidents/${incidentId}/timeline`,
    'POST'
  );
}

/**
 * Create WebSocket connection for real-time security events
 */
export function createSecurityWebSocket(
  onMessage: (event: any) => void,
  onError?: (error: Event) => void
): WebSocket | null {
  try {
    const wsUrl = SMARTPAY_API_BASE.replace(/^https/, 'wss').replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/api/v1/admin/security/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return ws;
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    return null;
  }
}
