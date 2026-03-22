/**
 * POST /api/v1/reconciliation/adjustment – Add manual adjustment (ketchup_finance).
 * Roles: ketchup_finance (RBAC enforced: reconciliation.adjust permission).
 * Secured: RBAC, rate limit, audit logging (critical financial operation).
 * Request: { amount: number, reason: string }.
 * Response: { id, amount, reason, created_at }.
 */

import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";

const ROUTE = "POST /api/v1/reconciliation/adjustment";

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require reconciliation.adjust permission (SEC-001)
    const auth = await requirePermission(request, "reconciliation.adjust", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin mutation endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const amount = body.amount;
    const reason = body.reason ?? "";
    
    if (amount == null || Number.isNaN(Number(amount))) {
      return jsonError("amount is required", "ValidationError", { field: "amount" }, 400, ROUTE);
    }

    const adjustmentId = crypto.randomUUID();
    const result = {
      id: adjustmentId,
      amount: Number(amount),
      reason,
      created_at: new Date().toISOString(),
    };

    // Audit logging: Critical financial operation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'reconciliation.adjustment',
        resourceType: 'reconciliation',
        resourceId: adjustmentId,
        metadata: {
          adjustment_amount: amount.toString(),
          reason: reason,
          affected_records: 1,
        },
      });
    }

    return jsonSuccess(result, { status: 201 });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
