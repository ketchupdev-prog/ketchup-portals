/**
 * Caching Layer for Efficient Data Management
 * Browser-based cache with TTL support for dashboard data
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheConfig {
  defaultTTL?: number;
  maxSize?: number;
  cleanupInterval?: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private config: Required<CacheConfig>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.config = {
      defaultTTL: config.defaultTTL || 60000, // 60 seconds
      maxSize: config.maxSize || 100,
      cleanupInterval: config.cleanupInterval || 300000, // 5 minutes
    };

    this.startCleanup();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      entries: entries.map(([key, entry]) => ({
        key,
        age: now - entry.timestamp,
        ttl: entry.ttl,
        hits: entry.hits,
        expired: now - entry.timestamp > entry.ttl,
      })),
      totalHits: entries.reduce((sum, [, entry]) => sum + entry.hits, 0),
    };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let lowestHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lowestHits || (entry.hits === lowestHits && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHits = entry.hits;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanup(): void {
    if (typeof window === 'undefined') return;

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

export const dashboardCache = new CacheManager({
  defaultTTL: 60000, // 60 seconds
  maxSize: 100,
  cleanupInterval: 300000, // 5 minutes
});

export const CACHE_KEYS = {
  KRI_METRICS: 'compliance:kri-metrics',
  BON_REPORTS: 'compliance:bon-reports',
  COMPLIANCE_ALERTS: 'compliance:alerts',
  RECONCILIATION_STATUS: 'financial:reconciliation-status',
  RECONCILIATION_HISTORY: 'financial:reconciliation-history',
  TRANSACTION_METRICS: 'financial:transaction-metrics',
  TRANSACTION_FEED: 'financial:transaction-feed',
  CAPITAL_ADEQUACY: 'financial:capital-adequacy',
  VOUCHER_FINANCIALS: 'financial:voucher-financials',
  SECURITY_EVENTS: 'security:events',
  SECURITY_METRICS: 'security:metrics',
  THREAT_ANALYSIS: 'security:threat-analysis',
  ANALYTICS_OVERVIEW: 'analytics:overview',
  ANALYTICS_REPORTS: 'analytics:reports',
  AI_COPILOT_PERFORMANCE: 'ai:copilot-performance',
  AI_MODEL_METRICS: 'ai:model-metrics',
  SYSTEM_HEALTH: 'system:health',
} as const;

export function getCacheKey(base: string, params?: Record<string, any>): string {
  if (!params) return base;

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return `${base}:${sortedParams}`;
}

export async function cachedFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = dashboardCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  dashboardCache.set(cacheKey, data, ttl);
  return data;
}

export class LocalStorageCache {
  private prefix: string;

  constructor(prefix: string = 'smartpay:') {
    this.prefix = prefix;
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (parsed.expiry && now > parsed.expiry) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return parsed.data as T;
    } catch (error) {
      console.error('[LocalStorageCache] Get error:', error);
      return null;
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (typeof window === 'undefined') return;

    try {
      const item = {
        data,
        expiry: ttl ? Date.now() + ttl : null,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('[LocalStorageCache] Set error:', error);
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const persistentCache = new LocalStorageCache('smartpay:cache:');
