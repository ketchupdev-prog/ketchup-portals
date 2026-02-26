/**
 * Require a specific permission for the request (PRD: configurable roles/permissions).
 * Uses getPortalSession + getPermissionsForUser; returns 401/403 if not allowed.
 * Location: src/lib/require-permission.ts
 */

import { NextRequest } from "next/server";
import { getPortalSession } from "@/lib/portal-auth";
import { getPermissionsForUser } from "@/lib/permissions";
import { jsonError } from "@/lib/api-response";

/**
 * If the request has no valid session, returns 401.
 * If the user does not have the required permission (from role_id or legacy role), returns 403.
 * Otherwise returns null (caller proceeds).
 */
export async function requirePermission(
  request: NextRequest,
  permissionSlug: string,
  route: string
): Promise<Response | null> {
  const session = getPortalSession(request);
  if (!session) {
    return jsonError("Unauthorized", "Unauthorized", undefined, 401, route);
  }
  const slugs = await getPermissionsForUser(session.userId);
  if (!slugs.includes(permissionSlug)) {
    return jsonError("Forbidden", "Forbidden", undefined, 403, route);
  }
  return null;
}

/**
 * Require any one of the given permissions.
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissionSlugs: string[],
  route: string
): Promise<Response | null> {
  const session = getPortalSession(request);
  if (!session) {
    return jsonError("Unauthorized", "Unauthorized", undefined, 401, route);
  }
  const slugs = await getPermissionsForUser(session.userId);
  const hasAny = permissionSlugs.some((p) => slugs.includes(p));
  if (!hasAny) {
    return jsonError("Forbidden", "Forbidden", undefined, 403, route);
  }
  return null;
}
