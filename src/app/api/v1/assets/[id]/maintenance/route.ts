/**
 * POST /api/v1/assets/:id/maintenance – Log maintenance activity.
 * Roles: field_tech, field_lead (RBAC enforced: assets.manage permission).
 * Secured: RBAC, rate limit, audit logging.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { maintenanceLogs, assets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

const ROUTE = "POST /api/v1/assets/[id]/maintenance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require assets.manage permission (SEC-001)
    const auth = await requirePermission(request, "assets.manage", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin mutation (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const type = body.type ?? "inspection";
    const validTypes = ["inspection", "repair", "service", "replenish"];
    if (!validTypes.includes(type)) {
      return jsonError("type must be inspection, repair, service, or replenish", "ValidationError", { field: "type" }, 400, ROUTE);
    }
    const asset = await db.select().from(assets).where(eq(assets.id, id)).limit(1).then((r) => r[0]);
    if (!asset) return jsonError("Asset not found", "NotFound", { id }, 404, ROUTE);

    const cashBefore = body.cash_before != null ? String(body.cash_before) : null;
    const cashAdded = body.cash_added != null ? String(body.cash_added) : null;
    const cashAfter = body.cash_after != null ? String(body.cash_after) : null;

    const [inserted] = await db
      .insert(maintenanceLogs)
      .values({
        assetId: id,
        technicianId: body.technician_id ?? null,
        type,
        notes: body.notes ?? null,
        cashBefore,
        cashAdded,
        cashAfter,
      })
      .returning({ id: maintenanceLogs.id, created_at: maintenanceLogs.createdAt });

    if (type === "replenish" && cashAfter != null) {
      await db.update(assets).set({ cashLevel: cashAfter, lastReplenishment: new Date() }).where(eq(assets.id, id));
    }

    // Audit logging: Maintenance activity (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: "field.maintenance_log",
        resourceType: "maintenance_log",
        resourceId: inserted.id,
        metadata: {
          assetId: id,
          assetName: asset.name,
          maintenanceType: type,
          technicianId: body.technician_id,
          notes: body.notes,
          cashBefore,
          cashAdded,
          cashAfter,
        },
      });
    }

    return jsonSuccess({ id: inserted.id, created_at: inserted.created_at.toISOString() }, { status: 201 });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
