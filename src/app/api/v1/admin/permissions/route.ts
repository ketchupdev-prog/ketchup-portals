/**
 * GET /api/v1/admin/permissions – List all permissions.
 * Requires permission: admin.manage_roles or admin.manage_users.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { permissions } from "@/db/schema";
import { requireAnyPermission } from "@/lib/require-permission";
import { jsonError } from "@/lib/api-response";

const ROUTE = "GET /api/v1/admin/permissions";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAnyPermission(request, ["admin.manage_roles", "admin.manage_users"], ROUTE);
    if (auth) return auth;

    const rows = await db.select().from(permissions).orderBy(permissions.resource, permissions.action);
    const data = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      resource: p.resource,
      action: p.action,
      description: p.description,
      created_at: p.createdAt?.toISOString() ?? null,
    }));
    return Response.json({ data });
  } catch (err) {
    console.error(ROUTE, err);
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
