/**
 * Compliance Polling Hooks – Real-time updates for KRI metrics and BoN reports
 * Location: src/lib/hooks/use-compliance-polling.ts
 * Used by: KRI Dashboard, BoN Reporting Dashboard, Compliance Alerts
 */

import { useEffect, useState, useCallback } from 'react';
import { getKRIMetrics, getBonReportQueue, getComplianceAlerts } from '@/lib/api/compliance';
import type { KRIMetrics, BonReportQueue, ComplianceAlertResponse } from '@/lib/types/compliance';

interface PollingOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export function useKRIPolling(options: PollingOptions = {}) {
  const { enabled = true, intervalMs = 60000 } = options;
  const [data, setData] = useState<KRIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const response = await getKRIMetrics();
    if (response.success && response.data) {
      setData(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch KRI metrics');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, intervalMs, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useBonReportPolling(options: PollingOptions = {}) {
  const { enabled = true, intervalMs = 10000 } = options;
  const [data, setData] = useState<BonReportQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const response = await getBonReportQueue();
    if (response.success && response.data) {
      setData(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch BoN report queue');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, intervalMs, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useComplianceAlertsPolling(options: PollingOptions = {}) {
  const { enabled = true, intervalMs = 30000 } = options;
  const [data, setData] = useState<ComplianceAlertResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const response = await getComplianceAlerts();
    if (response.success && response.data) {
      setData(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch compliance alerts');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, intervalMs, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
