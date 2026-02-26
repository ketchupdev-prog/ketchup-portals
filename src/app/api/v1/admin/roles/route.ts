/**
 * GET /api/v1/admin/roles – List all roles with their permission slugs.
 * Requires permission: admin.manage_roles (or admin.manage_users to view).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { roles, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requireAnyPermission } from "@/lib/require-permission";

const ROUTE = "GET /api/v1/admin/roles";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAnyPermission(request, ["admin.manage_roles", "admin.manage_users"], ROUTE);
    if (auth) return auth;

    const roleRows = await db.select().from(roles).orderBy(roles.name);
    const result = await Promise.all(
      roleRows.map(async (role) => {
        const perms = await db
          .select({ slug: permissions.slug, name: permissions.name })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, role.id));
        return {
          id: role.id,
          name: role.name,
          slug: role.slug,
          description: role.description,
          permissions: perms,
          created_at: role.createdAt?.toISOString() ?? null,
          updated_at: role.updatedAt?.toISOString() ?? null,
        };
      })
    );
    return Response.json({ data: result });
  } catch (err) {
    console.error(ROUTE, err);
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
