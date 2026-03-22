/**
 * GET  /api/v1/vouchers/duplicates/{id} – Get single duplicate event.
 * PATCH /api/v1/vouchers/duplicates/{id} – Update status / resolution notes (PRD §3.3.11).
 * Roles: ketchup_compliance, ketchup_finance (RBAC enforced: duplicate_redemptions.list for GET, duplicate_redemptions.resolve for PATCH).
 */

import { NextRequest } from "next/server";
import {
  getDuplicateEvent,
  updateDuplicateEvent,
  type DuplicateEventStatus,
} from "@/lib/services/duplicate-redemption-service";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";

const VALID_STATUSES: DuplicateEventStatus[] = [
  "advance_posted",
  "under_review",
  "no_financial_impact",
  "agent_appealing",
  "resolved",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ROUTE = "GET /api/v1/vouchers/duplicates/[id]";
  try {
    // RBAC: Require duplicate_redemptions.list permission (SEC-001)
    const auth = await requirePermission(request, "duplicate_redemptions.list", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const event = await getDuplicateEvent(id);
    if (!event) {
      return jsonError("Duplicate event not found", "NotFound", { id }, 404, ROUTE);
    }
    return Response.json({ data: event });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Get duplicate error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ROUTE = "PATCH /api/v1/vouchers/duplicates/[id]";
  try {
    // RBAC: Require duplicate_redemptions.resolve permission (SEC-001)
    const auth = await requirePermission(request, "duplicate_redemptions.resolve", ROUTE);
    if (auth) return auth;

    // Rate limiting: Admin endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return jsonError("Invalid request body", "ValidationError", undefined, 400, ROUTE);
    }

    const { status, resolution_notes } = body as {
      status?: string;
      resolution_notes?: string;
    };

    if (status && !VALID_STATUSES.includes(status as DuplicateEventStatus)) {
      return jsonError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        "ValidationError",
        undefined,
        400,
        ROUTE
      );
    }

    const updated = await updateDuplicateEvent(id, {
      ...(status && { status: status as DuplicateEventStatus }),
      ...(resolution_notes !== undefined && { resolution_notes }),
    });

    if (!updated) {
      return jsonError("Duplicate event not found", "NotFound", { id }, 404, ROUTE);
    }

    // Audit logging: Critical financial operation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'duplicate_redemption.resolve',
        resourceType: 'duplicate_redemption',
        resourceId: id,
        metadata: {
          ...(status && { status }),
          ...(resolution_notes !== undefined && { resolution_notes }),
        },
      });
    }

    return Response.json({ success: true, data: updated });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Update duplicate error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
