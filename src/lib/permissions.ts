/**
 * Resolve permissions for a portal user (from role_id or legacy role slug).
 * Used by requirePermission and admin UI. Permissions are stored in DB (roles, permissions, role_permissions).
 * Location: src/lib/permissions.ts
 */

import { db } from "@/lib/db";
import { portalUsers, roles, rolePermissions, permissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/** Permission slugs that each legacy role (slug) gets when role_id is not set. Default mapping. */
const LEGACY_ROLE_PERMISSIONS: Record<string, string[]> = {
  ketchup_ops: [
    "dashboard.summary",
    "float_requests.list",
    "float_requests.approve",
    "beneficiaries.list",
    "agents.list",
    "vouchers.list",
    "audit.view",
    "admin.manage_users",
    "admin.manage_roles",
  ],
  ketchup_finance: [
    "dashboard.summary",
    "float_requests.list",
    "float_requests.approve",
    "beneficiaries.list",
    "agents.list",
    "vouchers.list",
    "audit.view",
  ],
  ketchup_compliance: ["dashboard.summary", "beneficiaries.list", "audit.view", "duplicate_redemptions.list", "duplicate_redemptions.resolve"],
  ketchup_support: ["dashboard.summary", "beneficiaries.list", "agents.list", "float_requests.list"],
  gov_manager: ["dashboard.summary", "programmes.list", "government.reports", "audit.view"],
  gov_auditor: ["programmes.list", "government.reports", "audit.view"],
  agent: ["agent.dashboard", "agent.float.request", "agent.parcels", "agent.transactions"],
  field_tech: ["field.tasks", "field.map", "field.assets"],
  field_lead: ["field.tasks", "field.map", "field.assets", "field.tasks.assign"],
};

/**
 * Get permission slugs for a portal user. Uses role_id if set, else resolves from user.role (legacy).
 */
export async function getPermissionsForUser(portalUserId: string): Promise<string[]> {
  const [user] = await db
    .select({ roleId: portalUsers.roleId, role: portalUsers.role })
    .from(portalUsers)
    .where(eq(portalUsers.id, portalUserId))
    .limit(1);

  if (!user) return [];

  if (user.roleId) {
    const perms = await db
      .select({ slug: permissions.slug })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));
    return perms.map((p) => p.slug);
  }

  const legacy = LEGACY_ROLE_PERMISSIONS[user.role];
  return legacy ? [...legacy] : [];
}

/**
 * Check if a user has a given permission slug (e.g. "float_requests.list").
 */
export async function userHasPermission(portalUserId: string, permissionSlug: string): Promise<boolean> {
  const slugs = await getPermissionsForUser(portalUserId);
  return slugs.includes(permissionSlug);
}
