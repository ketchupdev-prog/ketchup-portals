/**
 * GET /api/v1/admin/users – List portal users with role and role_id.
 * Requires permission: admin.manage_users or admin.manage_roles.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { portalUsers, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAnyPermission } from "@/lib/require-permission";
import { jsonError } from "@/lib/api-response";

const ROUTE = "GET /api/v1/admin/users";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAnyPermission(request, ["admin.manage_roles", "admin.manage_users"], ROUTE);
    if (auth) return auth;

    const users = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
        fullName: portalUsers.fullName,
        role: portalUsers.role,
        roleId: portalUsers.roleId,
        agentId: portalUsers.agentId,
        createdAt: portalUsers.createdAt,
        roleName: roles.name,
        roleSlug: roles.slug,
      })
      .from(portalUsers)
      .leftJoin(roles, eq(portalUsers.roleId, roles.id))
      .orderBy(portalUsers.email);

    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.fullName,
      role: u.role,
      role_id: u.roleId,
      role_name: u.roleName ?? null,
      role_slug: u.roleSlug ?? null,
      agent_id: u.agentId,
      created_at: u.createdAt?.toISOString() ?? null,
    }));
    return Response.json({ data });
  } catch (err) {
    console.error(ROUTE, err);
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
