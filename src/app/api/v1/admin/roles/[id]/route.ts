/**
 * PUT /api/v1/admin/roles/:id – Update a role (name, description, permission IDs).
 * Requires permission: admin.manage_roles.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { roles, rolePermissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";

const ROUTE = "PUT /api/v1/admin/roles/[id]";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, "admin.manage_roles", ROUTE);
    if (auth) return auth;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const name = body.name;
    const description = body.description;
    const permissionIds = Array.isArray(body.permission_ids) ? body.permission_ids : undefined;

    const [existing] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!existing) {
      return jsonError("Role not found", "NotFound", { id }, 404, ROUTE);
    }

    const updates: { name?: string; description?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description === null || description === "" ? null : String(description);

    if (Object.keys(updates).length > 1) {
      await db.update(roles).set(updates).where(eq(roles.id, id));
    }

    if (permissionIds !== undefined) {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
      const validIds = permissionIds.filter((pid: unknown) => typeof pid === "string" && pid.length > 0);
      if (validIds.length > 0) {
        await db.insert(rolePermissions).values(
          validIds.map((permissionId: string) => ({
            roleId: id,
            permissionId,
          }))
        );
      }
    }

    const [updated] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return Response.json({
      data: updated
        ? {
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            description: updated.description,
            created_at: updated.createdAt?.toISOString() ?? null,
            updated_at: updated.updatedAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (err) {
    console.error(ROUTE, err);
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
