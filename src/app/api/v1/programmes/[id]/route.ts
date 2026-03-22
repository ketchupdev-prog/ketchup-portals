/**
 * GET /api/v1/programmes/:id – Programme detail.
 * Roles: ketchup_*, gov_* (RBAC enforced: programmes.list permission).
 * PUT /api/v1/programmes/:id – Update programme.
 * Roles: gov_manager (RBAC enforced: programmes.list permission).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { programmes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { logger } from "@/lib/logger";

const GET_ROUTE = "GET /api/v1/programmes/[id]";
const PUT_ROUTE = "PUT /api/v1/programmes/[id]";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require programmes.list permission (SEC-001)
    const auth = await requirePermission(request, "programmes.list", GET_ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const row = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1).then((r) => r[0]);
    if (!row) return jsonError("Programme not found", "NotFound", { id }, 404, GET_ROUTE);

    return Response.json({
      id: row.id,
      name: row.name,
      description: row.description,
      allocated_budget: row.allocatedBudget,
      spent_to_date: row.spentToDate,
      start_date: row.startDate,
      end_date: row.endDate,
      verification_frequency_days: row.verificationFrequencyDays,
    });
  } catch (err) {
    logger.error(GET_ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, GET_ROUTE);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require programmes.list permission (SEC-001)
    const auth = await requirePermission(request, "programmes.list", PUT_ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin operation (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updateData: Record<string, any> = {};
    const changedFields: Record<string, any> = {};

    if (body.name != null) {
      updateData.name = String(body.name);
      changedFields.name = body.name;
    }
    if (body.description != null) {
      updateData.description = body.description;
      changedFields.description = body.description;
    }
    if (body.allocated_budget != null) {
      updateData.allocatedBudget = String(body.allocated_budget);
      changedFields.allocated_budget = body.allocated_budget;
    }
    if (body.start_date != null) {
      updateData.startDate = body.start_date;
      changedFields.start_date = body.start_date;
    }
    if (body.end_date != null) {
      updateData.endDate = body.end_date;
      changedFields.end_date = body.end_date;
    }
    if (body.verification_frequency_days != null) {
      updateData.verificationFrequencyDays = body.verification_frequency_days;
      changedFields.verification_frequency_days = body.verification_frequency_days;
    }

    const [updated] = await db
      .update(programmes)
      .set(updateData)
      .where(eq(programmes.id, id))
      .returning({ id: programmes.id });

    if (!updated) return jsonError("Programme not found", "NotFound", { id }, 404, PUT_ROUTE);

    // Audit logging: Critical operation - government programme modification (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'programme.update',
        resourceType: 'programme',
        resourceId: updated.id,
        metadata: {
          changedFields,
        },
      });
    }

    return jsonSuccess({ id: updated.id });
  } catch (err) {
    logger.error(PUT_ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, PUT_ROUTE);
  }
}
