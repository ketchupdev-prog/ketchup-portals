/**
 * AI/ML Polling Hook – Real-time monitoring with configurable intervals
 * Location: src/lib/hooks/use-ai-ml-polling.ts
 * Usage: Real-time updates for AI/ML dashboards
 *
 * Fetch functions return Promise<T>; errors are caught and surfaced via `error` state.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getCopilotPerformance, getRAGMetrics, getMLModels, getDuckDBStatus, getLLMCosts } from '@/lib/api/ai-ml';
import { mapCopilotApiToDashboard } from '@/lib/api/ai-ml-dashboard-mapper';

interface PollingConfig {
  enabled?: boolean;
  interval?: number;
  onError?: (error: string) => void;
}

export function useAIMLPolling<T>(fetchFn: () => Promise<T>, config: PollingConfig = {}) {
  const { enabled = true, interval = 60000, onError } = config;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFn();

      if (!isMountedRef.current) return;

      setData(result);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, onError]);

  const refresh = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      setLoading(false);
      return;
    }

    void fetchData();

    if (interval > 0) {
      const poll = () => {
        timeoutRef.current = setTimeout(() => {
          void fetchData();
          poll();
        }, interval);
      };
      poll();
    }

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, interval, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
  };
}

export function useCopilotPolling(config?: PollingConfig) {
  const fetchFn = useCallback(async () => {
    const raw = await getCopilotPerformance();
    return mapCopilotApiToDashboard(raw);
  }, []);
  return useAIMLPolling(fetchFn, { interval: 60000, ...config });
}

export function useRAGPolling(config?: PollingConfig) {
  const fetchFn = useCallback(() => getRAGMetrics(), []);
  return useAIMLPolling(fetchFn, { interval: 300000, ...config });
}

export function useMLModelsPolling(config?: PollingConfig) {
  const fetchFn = useCallback(() => getMLModels(), []);
  return useAIMLPolling(fetchFn, { interval: 600000, ...config });
}

export function useDuckDBPolling(config?: PollingConfig & { isSyncing?: boolean }) {
  const interval = config?.isSyncing ? 30000 : 300000;
  const fetchFn = useCallback(() => getDuckDBStatus(), []);
  return useAIMLPolling(fetchFn, { interval, ...config });
}

export function useLLMCostsPolling(config?: PollingConfig) {
  const fetchFn = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return getLLMCosts({ start, end });
  }, []);
  return useAIMLPolling(fetchFn, { interval: 900000, ...config });
}
