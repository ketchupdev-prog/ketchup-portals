/**
 * POST /api/v1/field/maintenance – Log maintenance activity.
 * Roles: field_tech (RBAC enforced: field.tasks permission).
 * Secured: RBAC, rate limiting, audit logging.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { maintenanceLogs, assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { logger } from "@/lib/logger";

const ROUTE = "POST /api/v1/field/maintenance";

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require field.tasks permission (SEC-001)
    const auth = await requirePermission(request, "field.tasks", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin mutations (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const assetId = body.asset_id;
    if (!assetId) return jsonError("asset_id is required", "ValidationError", { field: "asset_id" }, 400, ROUTE);
    const type = body.type ?? "inspection";
    const validTypes = ["inspection", "repair", "service", "replenish"];
    if (!validTypes.includes(type)) {
      return jsonError("type must be inspection, repair, service, or replenish", "ValidationError", { field: "type" }, 400, ROUTE);
    }
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1).then((r) => r[0]);
    if (!asset) return jsonError("Asset not found", "NotFound", { asset_id: assetId }, 404, ROUTE);
    const [inserted] = await db
      .insert(maintenanceLogs)
      .values({
        assetId,
        technicianId: body.technician_id ?? null,
        type,
        notes: body.notes ?? null,
        cashBefore: body.cash_before != null ? String(body.cash_before) : null,
        cashAdded: body.cash_added != null ? String(body.cash_added) : null,
        cashAfter: body.cash_after != null ? String(body.cash_after) : null,
      })
      .returning({ id: maintenanceLogs.id, created_at: maintenanceLogs.createdAt });
    if (type === "replenish" && body.cash_after != null) {
      await db.update(assets).set({ cashLevel: String(body.cash_after), lastReplenishment: new Date() }).where(eq(assets.id, assetId));
    }

    // Audit logging: Maintenance activity (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'field.maintenance_log',
        resourceType: 'maintenance_log',
        resourceId: inserted.id,
        metadata: {
          assetId,
          assetName: asset.name,
          type,
          technicianId: body.technician_id ?? null,
          cashBefore: body.cash_before ?? null,
          cashAdded: body.cash_added ?? null,
          cashAfter: body.cash_after ?? null,
        },
      });
    }

    return jsonSuccess({ id: inserted.id, created_at: inserted.created_at.toISOString() }, { status: 201 });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
