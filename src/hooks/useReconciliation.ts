/**
 * Reconciliation Polling Hook
 * Polls reconciliation status every 60 seconds for financial dashboard
 */

'use client';

import { usePolling, type UsePollingOptions, type UsePollingResult } from './usePolling';
import { getReconciliationStatus, type ReconciliationStatus } from '@/lib/api/financial';
import { cachedFetch, CACHE_KEYS } from '@/lib/cache/cache-manager';

const RECONCILIATION_POLL_INTERVAL =
  parseInt(process.env.NEXT_PUBLIC_RECONCILIATION_POLL_INTERVAL || '60000', 10);

export function useReconciliation(
  options?: UsePollingOptions
): UsePollingResult<ReconciliationStatus> {
  return usePolling<ReconciliationStatus>(
    () =>
      cachedFetch(
        CACHE_KEYS.RECONCILIATION_STATUS,
        () => getReconciliationStatus(),
        RECONCILIATION_POLL_INTERVAL
      ),
    RECONCILIATION_POLL_INTERVAL,
    options
  );
}
