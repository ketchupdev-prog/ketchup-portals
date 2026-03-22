/**
 * 2FA Enforcement Service – Mandatory 2FA for high-privilege roles
 * Location: src/lib/services/require-2fa.ts
 * 
 * Purpose: Determine if 2FA is required for a user based on their role
 * Required by: SEC-005 - Two-Factor Authentication implementation
 * 
 * Security Policy:
 * - Ketchup Finance: REQUIRED (handles financial operations)
 * - Ketchup Compliance: REQUIRED (access to audit logs, sensitive data)
 * - Ketchup Ops: REQUIRED (admin access, user management)
 * - Other roles: OPTIONAL (but recommended)
 * 
 * Usage:
 *   import { check2FARequired, enforce2FAEnabled } from '@/lib/services/require-2fa';
 *   
 *   // Check if 2FA is required for user
 *   const required = await check2FARequired(userId);
 *   if (required) {
 *     // Show banner: "You must enable 2FA to access this account"
 *   }
 *   
 *   // Enforce 2FA is enabled (throw error if not)
 *   await enforce2FAEnabled(userId);
 */

import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Roles that REQUIRE 2FA to be enabled
 * These roles have access to sensitive operations and must use 2FA
 */
const REQUIRED_2FA_ROLES = [
  'ketchup_finance',      // Financial operations, voucher issuance
  'ketchup_compliance',   // Audit logs, compliance reporting
  'ketchup_ops',          // Admin access, user management
];

/**
 * Check if 2FA is required for a user based on their role
 * 
 * @param userId - Portal user UUID
 * @returns Promise<boolean> - True if 2FA is required for this user
 * 
 * @example
 * const session = getPortalSession(request);
 * const requires2FA = await check2FARequired(session.userId);
 * if (requires2FA && !user.totpEnabled) {
 *   // Show banner: "You must enable 2FA"
 * }
 */
export async function check2FARequired(userId: string): Promise<boolean> {
  try {
    const [user] = await db
      .select({
        role: portalUsers.role,
      })
      .from(portalUsers)
      .where(eq(portalUsers.id, userId))
      .limit(1);

    if (!user) {
      return false; // User not found (should not happen in normal flow)
    }

    return REQUIRED_2FA_ROLES.includes(user.role);
  } catch (error) {
    console.error('[2FA Enforcement] Failed to check 2FA requirement:', error);
    // Fail closed: if we can't determine role, assume 2FA is required
    return true;
  }
}

/**
 * Check if 2FA is enabled for a user
 * 
 * @param userId - Portal user UUID
 * @returns Promise<boolean> - True if user has 2FA enabled
 * 
 * @example
 * const enabled = await is2FAEnabled(userId);
 * if (!enabled) {
 *   return Response.json({
 *     errors: [{ code: '2FARequired', message: 'You must enable 2FA to access this resource' }]
 *   }, { status: 403 });
 * }
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  try {
    const [user] = await db
      .select({
        totpEnabled: portalUsers.totpEnabled,
      })
      .from(portalUsers)
      .where(eq(portalUsers.id, userId))
      .limit(1);

    return user?.totpEnabled ?? false;
  } catch (error) {
    console.error('[2FA Enforcement] Failed to check 2FA status:', error);
    return false;
  }
}

/**
 * Enforce that 2FA is enabled for a user (throw error if not enabled and required)
 * Use this as a guard in API routes that require 2FA
 * 
 * @param userId - Portal user UUID
 * @throws Error if 2FA is required but not enabled
 * 
 * @example
 * // In sensitive API route:
 * const session = getPortalSession(request);
 * if (!session) return Response.json({ errors: [{ code: 'Unauthorized' }] }, { status: 401 });
 * 
 * try {
 *   await enforce2FAEnabled(session.userId);
 * } catch (error) {
 *   return Response.json({
 *     errors: [{ code: '2FARequired', message: error.message }]
 *   }, { status: 403 });
 * }
 * 
 * // Proceed with sensitive operation...
 */
export async function enforce2FAEnabled(userId: string): Promise<void> {
  const required = await check2FARequired(userId);
  
  if (!required) {
    return; // 2FA not required for this role
  }

  const enabled = await is2FAEnabled(userId);

  if (!enabled) {
    throw new Error('Two-factor authentication is required for your role. Please enable 2FA in Settings → Security.');
  }
}

/**
 * Get user's 2FA status and requirement info
 * Useful for dashboard banners and settings pages
 * 
 * @param userId - Portal user UUID
 * @returns Promise with 2FA status details
 * 
 * @example
 * const status = await get2FAStatus(userId);
 * if (status.required && !status.enabled) {
 *   // Show banner: "2FA Required - Set up now"
 * } else if (status.enabled) {
 *   // Show badge: "2FA Enabled ✓"
 * }
 */
export async function get2FAStatus(userId: string): Promise<{
  required: boolean;
  enabled: boolean;
  role: string;
  verifiedAt: Date | null;
  backupCodesCount: number;
}> {
  try {
    const [user] = await db
      .select({
        role: portalUsers.role,
        totpEnabled: portalUsers.totpEnabled,
        totpVerifiedAt: portalUsers.totpVerifiedAt,
        backupCodes: portalUsers.backupCodes,
      })
      .from(portalUsers)
      .where(eq(portalUsers.id, userId))
      .limit(1);

    if (!user) {
      return {
        required: false,
        enabled: false,
        role: 'unknown',
        verifiedAt: null,
        backupCodesCount: 0,
      };
    }

    return {
      required: REQUIRED_2FA_ROLES.includes(user.role),
      enabled: user.totpEnabled ?? false,
      role: user.role,
      verifiedAt: user.totpVerifiedAt,
      backupCodesCount: user.backupCodes?.length ?? 0,
    };
  } catch (error) {
    console.error('[2FA Enforcement] Failed to get 2FA status:', error);
    throw error;
  }
}

/**
 * Check if a role requires 2FA (static check, no database query)
 * 
 * @param role - Portal user role string
 * @returns boolean - True if role requires 2FA
 * 
 * @example
 * if (isRoleRequired2FA('ketchup_finance')) {
 *   // Show "2FA Required" badge in user management UI
 * }
 */
export function isRoleRequired2FA(role: string): boolean {
  return REQUIRED_2FA_ROLES.includes(role);
}

/**
 * Get list of roles that require 2FA (for admin UI)
 * 
 * @returns Array of role strings that require 2FA
 */
export function getRequired2FARoles(): string[] {
  return [...REQUIRED_2FA_ROLES];
}
