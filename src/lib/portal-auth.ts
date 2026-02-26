/**
 * Portal auth – Session from cookie or Bearer token (base64url payload with sub, email, role, exp).
 * Used by GET /api/v1/portal/me and protected portal APIs.
 * Location: src/lib/portal-auth.ts
 */

import { NextRequest } from 'next/server';

const COOKIE_NAME = 'portal-auth';

export type PortalSession = {
  userId: string;
  email: string;
  role: string;
  exp: number;
};

function decodePayload(token: string): PortalSession | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf-8');
    const payload = JSON.parse(json) as { sub?: string; email?: string; role?: string; exp?: number };
    if (!payload.sub || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
    return {
      userId: payload.sub,
      email: payload.email ?? '',
      role: payload.role ?? '',
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Get session from request: cookie portal-auth or Authorization: Bearer <token>.
 * Returns null if missing or invalid/expired.
 */
export function getPortalSession(request: NextRequest): PortalSession | null {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie) {
    const session = decodePayload(cookie);
    if (session) return session;
  }
  const auth = request.headers.get('Authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  if (bearer) {
    const session = decodePayload(bearer);
    if (session) return session;
  }
  return null;
}

/**
 * Build Set-Cookie header value for portal-auth (call from login route).
 * PRD §7.5: HttpOnly, Secure (in production), SameSite=Lax, Path=/, Max-Age=expires_in.
 * maxAge in seconds.
 */
export function portalAuthCookieValue(token: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}
