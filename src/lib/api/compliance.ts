/**
 * Compliance API Client – Connect to SmartPay backend compliance endpoints
 * Location: src/lib/api/compliance.ts
 * Endpoints: /api/v1/compliance/*
 */

import type {
  KRIMetrics,
  BonReportQueue,
  BonReport,
  ComplianceAlertResponse,
  ComplianceEvent,
  APIResponse,
} from '@/lib/types/compliance';
import { mockKRIMetrics, mockBonReportQueue, mockComplianceAlerts, mockComplianceEvents } from './compliance-mock';

const SMARTPAY_API_BASE = process.env.NEXT_PUBLIC_SMARTPAY_BACKEND_URL || process.env.NEXT_PUBLIC_SMARTPAY_API_URL || 'http://localhost:8080';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_COMPLIANCE === 'true';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
  try {
    const response = await fetch(`${SMARTPAY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getKRIMetrics(): Promise<APIResponse<KRIMetrics>> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: mockKRIMetrics,
      timestamp: new Date().toISOString(),
    };
  }
  return fetchAPI<KRIMetrics>('/api/v1/compliance/kri');
}

export async function getKRIMetricById(id: number): Promise<APIResponse<KRIMetrics[keyof KRIMetrics]>> {
  return fetchAPI(`/api/v1/compliance/kri/${id}`);
}

export async function getBonReportQueue(): Promise<APIResponse<BonReportQueue>> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: mockBonReportQueue,
      timestamp: new Date().toISOString(),
    };
  }
  return fetchAPI<BonReportQueue>('/api/v1/compliance/bon-reporting');
}

export async function getBonReportById(reportId: string): Promise<APIResponse<BonReport>> {
  return fetchAPI<BonReport>(`/api/v1/compliance/bon-reporting/${reportId}`);
}

export async function submitBonReport(reportId: string): Promise<APIResponse<{ success: boolean; submittedAt: string }>> {
  return fetchAPI(`/api/v1/compliance/bon-reporting/${reportId}/submit`, {
    method: 'POST',
  });
}

export async function retryBonReport(reportId: string): Promise<APIResponse<{ success: boolean; retryCount: number }>> {
  return fetchAPI(`/api/v1/compliance/bon-reporting/${reportId}/retry`, {
    method: 'POST',
  });
}

export async function getComplianceAlerts(): Promise<APIResponse<ComplianceAlertResponse>> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: mockComplianceAlerts,
      timestamp: new Date().toISOString(),
    };
  }
  return fetchAPI<ComplianceAlertResponse>('/api/v1/compliance/alerts');
}

export async function resolveAlert(alertId: string): Promise<APIResponse<{ success: boolean }>> {
  return fetchAPI(`/api/v1/compliance/alerts/${alertId}/resolve`, {
    method: 'POST',
  });
}

export async function getComplianceCalendar(startDate: string, endDate: string): Promise<APIResponse<ComplianceEvent[]>> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: mockComplianceEvents,
      timestamp: new Date().toISOString(),
    };
  }
  return fetchAPI<ComplianceEvent[]>(
    `/api/v1/compliance/calendar?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
  );
}

export async function exportKRIData(format: 'CSV' | 'PDF' | 'XML', startDate: string, endDate: string): Promise<Blob | null> {
  try {
    const response = await fetch(
      `${SMARTPAY_API_BASE}/api/v1/compliance/kri/export?format=${format}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
      {
        method: 'GET',
      }
    );

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
