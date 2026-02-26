/**
 * PATCH /api/v1/admin/users/:id – Set a user's role (role_id and legacy role text).
 * Requires permission: admin.manage_users.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { portalUsers, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";

const ROUTE = "PATCH /api/v1/admin/users/[id]";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, "admin.manage_users", ROUTE);
    if (auth) return auth;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const roleId = body.role_id;

    const [user] = await db.select().from(portalUsers).where(eq(portalUsers.id, id)).limit(1);
    if (!user) {
      return jsonError("User not found", "NotFound", { id }, 404, ROUTE);
    }

    if (roleId === null || roleId === "") {
      await db.update(portalUsers).set({ roleId: null }).where(eq(portalUsers.id, id));
    } else {
      const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
      if (!role) {
        return jsonError("Role not found", "NotFound", { role_id: roleId }, 404, ROUTE);
      }
      await db
        .update(portalUsers)
        .set({ roleId: role.id, role: role.slug })
        .where(eq(portalUsers.id, id));
    }

    const [updated] = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
        fullName: portalUsers.fullName,
        role: portalUsers.role,
        roleId: portalUsers.roleId,
        createdAt: portalUsers.createdAt,
      })
      .from(portalUsers)
      .where(eq(portalUsers.id, id))
      .limit(1);

    return Response.json({
      data: updated
        ? {
            id: updated.id,
            email: updated.email,
            full_name: updated.fullName,
            role: updated.role,
            role_id: updated.roleId,
            created_at: updated.createdAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (err) {
    console.error(ROUTE, err);
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
