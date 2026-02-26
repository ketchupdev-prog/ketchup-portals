/**
 * RBAC helper for portal API routes (PRD §20, WHATS_LEFT §1).
 * Requires valid session and one of the allowed roles; returns 401/403 response or null if allowed.
 * Location: src/lib/require-role.ts
 */

import { NextRequest } from "next/server";
import { getPortalSession, type PortalSession } from "@/lib/portal-auth";
import { jsonError } from "@/lib/api-response";

export type AllowedRoles = string[] | readonly string[];

/**
 * If the request has no valid session, returns 401 Response.
 * If the session's role is not in allowedRoles, returns 403 Response.
 * Otherwise returns null (caller proceeds).
 * @param request – Next request
 * @param allowedRoles – e.g. ['ketchup_ops', 'ketchup_finance'] or ['agent']
 * @param route – For logging (e.g. 'GET /api/v1/float-requests')
 */
export function requireRole(
  request: NextRequest,
  allowedRoles: AllowedRoles,
  route: string
): Response | null {
  const session = getPortalSession(request);
  if (!session) {
    return jsonError("Unauthorized", "Unauthorized", undefined, 401, route);
  }
  const allowed = Array.isArray(allowedRoles) ? [...allowedRoles] : [...allowedRoles];
  if (!allowed.includes(session.role)) {
    return jsonError("Forbidden", "Forbidden", undefined, 403, route);
  }
  return null;
}

/**
 * Require session only (any authenticated portal user). Returns 401 if no session; otherwise null.
 * Use when the route is role-agnostic but must be authenticated.
 */
export function requireSession(request: NextRequest, route: string): Response | null {
  const session = getPortalSession(request);
  if (!session) {
    return jsonError("Unauthorized", "Unauthorized", undefined, 401, route);
  }
  return null;
}

/**
 * Get session or null. Use with requireSession/requireRole when you need the session after the check.
 */
export { getPortalSession };
export type { PortalSession };
