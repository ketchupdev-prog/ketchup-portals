/**
 * System Metrics Polling Hook
 * Polls system health metrics every 30 seconds
 */

'use client';

import { usePolling, type UsePollingOptions, type UsePollingResult } from './usePolling';
import { smartPayAPI } from '@/lib/api/client';
import { cachedFetch, CACHE_KEYS } from '@/lib/cache/cache-manager';

const SYSTEM_METRICS_POLL_INTERVAL = 30000; // 30 seconds

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
  uptime: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  activeConnections: number;
  timestamp: string;
}

async function fetchSystemMetrics(): Promise<SystemMetrics> {
  return smartPayAPI.get<SystemMetrics>('/api/v1/system/metrics');
}

export function useSystemMetrics(
  options?: UsePollingOptions
): UsePollingResult<SystemMetrics> {
  return usePolling<SystemMetrics>(
    () =>
      cachedFetch(
        CACHE_KEYS.SYSTEM_HEALTH,
        () => fetchSystemMetrics(),
        SYSTEM_METRICS_POLL_INTERVAL
      ),
    SYSTEM_METRICS_POLL_INTERVAL,
    options
  );
}
