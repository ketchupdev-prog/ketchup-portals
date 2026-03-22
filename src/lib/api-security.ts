/**
 * API security helpers: rate limit, auth, idempotency (docs/SECURITY.md).
 * Use with Open Banking–aligned responses (jsonErrorOpenBanking, 429 Retry-After).
 * Location: src/lib/api-security.ts
 */

import type { NextRequest } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { jsonErrors } from "@/lib/api-response";
import { getIdempotencyKey, requireJsonContentType } from "@/lib/open-banking";

export type RateLimitOptions = {
  /** Max requests per window (default 20 for general, 10 for auth). */
  maxRequests?: number;
  /** Key prefix (e.g. "vouchers:issue"). */
  keyPrefix: string;
};

/**
 * Check rate limit and return 429 with Retry-After if exceeded (Open Banking–aligned).
 * Call at start of POST/PUT/DELETE handlers.
 */
export function withRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): { allowed: true } | { allowed: false; response: Response } {
  const key = `${options.keyPrefix}:${getClientKey(request)}`;
  const max = options.maxRequests ?? 20;
  const { allowed, resetAt } = checkRateLimit(key, max);
  if (allowed) return { allowed: true };
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return {
    allowed: false,
    response: jsonErrors(
      [
        {
          code: "RateLimitExceeded",
          title: "Too Many Requests",
          message: "Rate limit exceeded. Retry after the time indicated in Retry-After header.",
        },
      ],
      429,
      { retryAfter }
    ),
  };
}

/**
 * Require Idempotency-Key header for mutation endpoints (payment initiation, voucher issue, etc.).
 * Returns error response if missing; otherwise returns the key.
 */
export function requireIdempotency(
  request: NextRequest,
  route: string
): { key: string } | { response: Response } {
  const key = getIdempotencyKey(request);
  if (!key) {
    return {
      response: jsonErrors(
        [
          {
            code: "IdempotencyKeyRequired",
            title: "Bad Request",
            message: "Idempotency-Key header is required for this operation.",
          },
        ],
        400
      ),
    };
  }
  return { key };
}

/**
 * Require Content-Type: application/json for POST/PUT with body.
 */
export function requireJson(
  request: NextRequest
): { ok: true } | { response: Response } {
  if (requireJsonContentType(request)) return { ok: true };
  return {
    response: jsonErrors(
      [
        {
          code: "UnsupportedMediaType",
          title: "Bad Request",
          message: "Content-Type must be application/json.",
        },
      ],
      415
    ),
  };
}

/**
 * Combined guard: rate limit + optional idempotency + optional JSON content type.
 * Use in order: first rate limit, then idempotency if required, then JSON for body.
 */
export function guardMutation(
  request: NextRequest,
  options: {
    rateLimitKey: string;
    rateLimitMax?: number;
    requireIdempotency?: boolean;
    requireJsonBody?: boolean;
    route?: string;
  }
):
  | { ok: true; idempotencyKey?: string }
  | { ok: false; response: Response } {
  const rl = withRateLimit(request, {
    keyPrefix: options.rateLimitKey,
    maxRequests: options.rateLimitMax,
  });
  if (!rl.allowed) return { ok: false, response: rl.response };

  if (options.requireIdempotency) {
    const idem = requireIdempotency(request, options.route ?? options.rateLimitKey);
    if ("response" in idem) return { ok: false, response: idem.response };
    if (options.requireJsonBody) {
      const json = requireJson(request);
      if ("response" in json) return { ok: false, response: json.response };
      return { ok: true, idempotencyKey: idem.key };
    }
    return { ok: true, idempotencyKey: idem.key };
  }

  if (options.requireJsonBody) {
    const json = requireJson(request);
    if ("response" in json) return { ok: false, response: json.response };
  }
  return { ok: true };
}
