/**
 * Rate Limiting Middleware – Prevent DoS attacks and API abuse
 * Location: src/lib/middleware/rate-limit.ts
 * 
 * Purpose: Implement rate limiting per IP and per user (Rule 16, PSD-12 security)
 * Required by: TASK.md SEC-004, PLANNING.md security requirements
 * 
 * Implementation: In-memory rate limiting (simple Map-based store)
 * For production with multiple servers, use Redis or Vercel KV
 * 
 * Usage:
 *   import { checkRateLimit } from '@/lib/middleware/rate-limit';
 *   
 *   export async function POST(request: NextRequest) {
 *     const rateLimitResponse = await checkRateLimit(request, {
 *       limit: 5,
 *       window: 60,
 *       identifier: 'auth-login',
 *     });
 *     if (rateLimitResponse) return rateLimitResponse; // 429 Too Many Requests
 *     
 *     // Process request...
 *   }
 */

import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api-response';
import { getPortalSession } from '@/lib/portal-auth';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in seconds (e.g., 60 = per minute) */
  window: number;
  /** Unique identifier for this rate limit (e.g., 'auth-login', 'voucher-issue') */
  identifier: string;
  /** Whether to use user ID for authenticated requests (default: false, uses IP) */
  useUserId?: boolean;
}

/**
 * In-memory rate limit store (simple Map)
 * Format: { key: { count: number, resetAt: number } }
 * 
 * For production with multiple servers, replace with:
 * - Redis (recommended for distributed rate limiting)
 * - Vercel KV (serverless-optimized key-value store)
 * - Upstash Redis (serverless Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Cleanup expired entries every 5 minutes (prevent memory leak)
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Extract client identifier (IP address or user ID)
 * 
 * @param request - Next.js request object
 * @param useUserId - Whether to use user ID (for authenticated requests)
 * @returns Identifier string (IP address or user ID)
 */
function getClientIdentifier(request: NextRequest, useUserId: boolean): string {
  if (useUserId) {
    const session = getPortalSession(request);
    if (session) {
      return `user:${session.userId}`;
    }
  }

  // Extract IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback (should not happen in Vercel)
  return 'ip:unknown';
}

/**
 * Check rate limit for the request
 * Returns Response (429 Too Many Requests) if limit exceeded, null otherwise
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Response if rate limit exceeded, null otherwise
 * 
 * @example
 * // Protect login endpoint (5 requests per minute per IP)
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await checkRateLimit(request, {
 *     limit: 5,
 *     window: 60,
 *     identifier: 'auth-login',
 *   });
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // Process login...
 * }
 * 
 * @example
 * // Protect voucher issuance (10 requests per minute per user)
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await checkRateLimit(request, {
 *     limit: 10,
 *     window: 60,
 *     identifier: 'voucher-issue',
 *     useUserId: true, // Rate limit per user, not IP
 *   });
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // Process voucher issuance...
 * }
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<Response | null> {
  const { limit, window, identifier, useUserId = false } = config;

  // Get client identifier (IP or user ID)
  const clientId = getClientIdentifier(request, useUserId);

  // Create unique key for this rate limit
  const key = `${identifier}:${clientId}`;

  // Get current state
  const now = Date.now();
  const state = rateLimitStore.get(key);

  // If no state or window expired, create new state
  if (!state || state.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + window * 1000,
    });
    return null; // Allow request
  }

  // Increment count
  state.count += 1;

  // Check if limit exceeded
  if (state.count > limit) {
    const retryAfter = Math.ceil((state.resetAt - now) / 1000);

    // Return 429 Too Many Requests
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        code: 'RateLimitExceeded',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        details: {
          limit,
          window,
          retryAfter,
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(state.resetAt / 1000).toString(),
        },
      }
    );
  }

  // Update state
  rateLimitStore.set(key, state);

  // Allow request (return null)
  return null;
}

/**
 * Preset rate limit configurations for common endpoints
 */
export const RATE_LIMITS = {
  /** Auth endpoints (login, register, forgot password) - 5 requests/minute per IP */
  AUTH: {
    limit: 5,
    window: 60,
    identifier: 'auth',
  },

  /** Password change - 3 requests/minute per user */
  PASSWORD_CHANGE: {
    limit: 3,
    window: 60,
    identifier: 'password-change',
    useUserId: true,
  },

  /** Voucher issuance - 10 requests/minute per user */
  VOUCHER_ISSUE: {
    limit: 10,
    window: 60,
    identifier: 'voucher-issue',
    useUserId: true,
  },

  /** Bulk SMS - 5 requests/minute per user */
  BULK_SMS: {
    limit: 5,
    window: 60,
    identifier: 'bulk-sms',
    useUserId: true,
  },

  /** Float approval - 20 requests/minute per user */
  FLOAT_APPROVAL: {
    limit: 20,
    window: 60,
    identifier: 'float-approval',
    useUserId: true,
  },

  /** Global API limit - 100 requests/minute per IP */
  GLOBAL: {
    limit: 100,
    window: 60,
    identifier: 'global',
  },

  /** Admin actions - 50 requests/minute per user */
  ADMIN: {
    limit: 50,
    window: 60,
    identifier: 'admin',
    useUserId: true,
  },

  /** Read-only endpoints - 200 requests/minute per IP */
  READ_ONLY: {
    limit: 200,
    window: 60,
    identifier: 'read-only',
  },
} as const;

/**
 * Helper: Apply rate limit to multiple endpoints with same config
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.READ_ONLY);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // Process request...
 * }
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<Response | null> {
  return checkRateLimit(request, config);
}

/**
 * Helper: Check if client is rate limited (without incrementing counter)
 * Useful for displaying rate limit status in UI
 * 
 * @returns { limited: boolean, remaining: number, resetAt: number }
 */
export function getRateLimitStatus(
  clientIdentifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetAt: number } {
  const key = `${config.identifier}:${clientIdentifier}`;
  const state = rateLimitStore.get(key);

  if (!state || state.resetAt < Date.now()) {
    return {
      limited: false,
      remaining: config.limit,
      resetAt: 0,
    };
  }

  const remaining = Math.max(0, config.limit - state.count);

  return {
    limited: state.count >= config.limit,
    remaining,
    resetAt: state.resetAt,
  };
}

/**
 * Helper: Clear rate limit for a specific client (admin override)
 * Use case: Unblock legitimate user accidentally rate limited
 * 
 * @example
 * // In admin endpoint
 * clearRateLimit('ip:192.168.1.1', 'auth-login');
 */
export function clearRateLimit(clientIdentifier: string, identifier: string): void {
  const key = `${identifier}:${clientIdentifier}`;
  rateLimitStore.delete(key);
  console.log(`[RATE LIMIT] Cleared for ${key}`);
}

/**
 * Helper: Get all rate limit entries (for monitoring dashboard)
 * Returns array of { key, count, resetAt } for debugging
 */
export function getAllRateLimitEntries(): Array<{
  key: string;
  count: number;
  resetAt: number;
}> {
  const entries: Array<{ key: string; count: number; resetAt: number }> = [];
  
  for (const [key, value] of rateLimitStore.entries()) {
    entries.push({
      key,
      count: value.count,
      resetAt: value.resetAt,
    });
  }

  return entries;
}

/**
 * Production Note: For multi-server deployments (Vercel Edge, multi-region)
 * 
 * Replace in-memory store with Redis:
 * 
 * import { Redis } from '@upstash/redis';
 * const redis = Redis.fromEnv();
 * 
 * async function checkRateLimit(request, config) {
 *   const key = `rate_limit:${config.identifier}:${clientId}`;
 *   const count = await redis.incr(key);
 *   
 *   if (count === 1) {
 *     await redis.expire(key, config.window);
 *   }
 *   
 *   if (count > config.limit) {
 *     return Response 429;
 *   }
 *   
 *   return null;
 * }
 * 
 * Benefits:
 * - Distributed rate limiting (works across all edge functions)
 * - Persistent (survives cold starts)
 * - Serverless-optimized (Upstash Redis has HTTP API)
 */
