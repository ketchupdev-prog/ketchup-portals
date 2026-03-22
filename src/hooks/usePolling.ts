/**
 * Generic Polling Hook for Automated Data Fetching
 * Provides automatic polling with error handling and manual refresh
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { handleAPIError, type APIError } from '@/lib/errors/error-handler';

export interface UsePollingOptions {
  enabled?: boolean;
  onError?: (error: APIError) => void;
  onSuccess?: (data: any) => void;
  retryOnError?: boolean;
  maxRetries?: number;
}

export interface UsePollingResult<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
  isPolling: boolean;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  interval: number,
  options: UsePollingOptions = {}
): UsePollingResult<T> {
  const {
    enabled = true,
    onError,
    onSuccess,
    retryOnError = true,
    maxRetries = 3,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<APIError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();

      if (!isMountedRef.current) return;

      setData(result);
      setLastUpdated(new Date());
      setLoading(false);
      retryCountRef.current = 0;

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const apiError = handleAPIError(err);
      setError(apiError);
      setLoading(false);

      if (onError) {
        onError(apiError);
      }

      if (retryOnError && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(
          `[usePolling] Retrying (${retryCountRef.current}/${maxRetries})...`
        );
      }
    }
  }, [fetchFn, onError, onSuccess, retryOnError, maxRetries]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    fetchData();
    setIsPolling(true);

    intervalRef.current = setInterval(() => {
      fetchData();
    }, interval);

    return () => {
      isMountedRef.current = false;
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    isPolling,
  };
}
