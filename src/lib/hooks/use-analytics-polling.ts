/**
 * Real-time analytics polling hook
 * Location: src/lib/hooks/use-analytics-polling.ts
 */

import { useEffect, useState, useCallback, useRef } from 'react';

interface PollingOptions {
  interval: number;
  enabled?: boolean;
}

export function useAnalyticsPolling<T>(
  fetchFn: () => Promise<T>,
  options: PollingOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!options.enabled) {
      return;
    }

    fetch();

    const poll = () => {
      timeoutRef.current = setTimeout(() => {
        fetch().then(() => {
          if (isMountedRef.current) {
            poll();
          }
        });
      }, options.interval);
    };

    poll();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetch, options.enabled, options.interval]);

  const refetch = useCallback(() => {
    return fetch();
  }, [fetch]);

  return { data, error, loading, refetch };
}
