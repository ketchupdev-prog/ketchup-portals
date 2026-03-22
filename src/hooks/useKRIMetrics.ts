/**
 * KRI Metrics Polling Hook
 * Polls KRI data every 60 seconds for compliance dashboard
 */

'use client';

import { usePolling, type UsePollingOptions, type UsePollingResult } from './usePolling';
import { getKRIMetrics } from '@/lib/api/compliance';
import { cachedFetch, CACHE_KEYS } from '@/lib/cache/cache-manager';
import type { KRIMetrics, APIResponse } from '@/lib/types/compliance';

const KRI_POLL_INTERVAL =
  parseInt(process.env.NEXT_PUBLIC_KRI_POLL_INTERVAL || '60000', 10);

export function useKRIMetrics(
  options?: UsePollingOptions
): UsePollingResult<APIResponse<KRIMetrics>> {
  return usePolling<APIResponse<KRIMetrics>>(
    () =>
      cachedFetch(CACHE_KEYS.KRI_METRICS, () => getKRIMetrics(), KRI_POLL_INTERVAL),
    KRI_POLL_INTERVAL,
    options
  );
}
