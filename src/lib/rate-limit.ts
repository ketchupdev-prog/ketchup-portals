/**
 * In-memory rate limiter for auth and SMS endpoints (Rule 16, docs/SECURITY.md §4).
 * Per-instance store; for production use Redis or Vercel KV for distributed limits.
 * Location: src/lib/rate-limit.ts
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

const WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Check rate limit by key (e.g. IP or user id). Returns true if under limit, false if over.
 * @param key – Identifier (e.g. x-forwarded-for or x-real-ip header, or user id when auth is wired).
 * @param maxRequests – Max requests per window (default 10 for auth, 20 for SMS).
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }
  entry.count += 1;
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed, remaining, resetAt: entry.resetAt };
}

/**
 * Get client identifier from request (IP). Prefer x-forwarded-for (Vercel) or x-real-ip.
 */
export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
