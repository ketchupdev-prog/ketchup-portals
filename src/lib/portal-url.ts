/**
 * Portal base URL – used for password reset links, emails, and any absolute portal URLs.
 * Server: pass getServerEnv() to use NEXT_PUBLIC_PORTAL_URL or BASE_URL (e.g. https://portal.ketchup.cc).
 * Client: call without args to use NEXT_PUBLIC_PORTAL_URL (inlined at build).
 * Location: src/lib/portal-url.ts
 */

import type { ServerEnv } from '@/lib/env';

/**
 * Returns the portal app base URL (no trailing slash).
 * - Server: pass getServerEnv() to use NEXT_PUBLIC_PORTAL_URL or fallback to BASE_URL.
 * - Client: call with no args; uses process.env.NEXT_PUBLIC_PORTAL_URL (empty if unset).
 */
export function getPortalBaseUrl(serverEnv?: ServerEnv | null): string {
  if (serverEnv) {
    const u = serverEnv.NEXT_PUBLIC_PORTAL_URL || serverEnv.BASE_URL || '';
    return u ? String(u).replace(/\/$/, '') : '';
  }
  const u = process.env.NEXT_PUBLIC_PORTAL_URL ?? '';
  const s = typeof u === 'string' && u !== 'undefined' ? u : '';
  return s ? s.replace(/\/$/, '') : '';
}

/**
 * Build an absolute portal URL for a path (e.g. /ketchup/login).
 * When base is set, returns base + path; otherwise returns path only (relative).
 */
export function buildPortalUrl(path: string, serverEnv?: ServerEnv | null): string {
  const base = getPortalBaseUrl(serverEnv);
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
