/**
 * Admin access control helpers
 * Checks if user has admin or super_admin role for admin portal access
 * Location: src/lib/admin-access.ts
 */

import { NextRequest } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import { jsonError } from '@/lib/api-response';

const ADMIN_ROLES = ['admin', 'super_admin', 'ketchup_admin'];

/**
 * Check if user has admin access based on their role
 */
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role.toLowerCase());
}

/**
 * Require admin role for API routes
 * Returns Response with 401/403 if not authorized, or null to proceed
 */
export async function requireAdminAccess(
  request: NextRequest,
  route: string
): Promise<Response | null> {
  const session = getPortalSession(request);
  
  if (!session) {
    return jsonError('Unauthorized', 'Unauthorized', undefined, 401, route);
  }

  if (!isAdminRole(session.role)) {
    return jsonError(
      'Forbidden - Admin access required',
      'Forbidden',
      { requiredRole: 'admin or super_admin', userRole: session.role },
      403,
      route
    );
  }

  return null;
}

/**
 * Get admin session or null if not authorized
 * Use this for non-API routes that need admin check
 */
export function getAdminSession(request: NextRequest) {
  const session = getPortalSession(request);
  if (!session || !isAdminRole(session.role)) {
    return null;
  }
  return session;
}
