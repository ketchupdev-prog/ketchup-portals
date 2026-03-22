/**
 * POST /api/v1/vouchers/issue – Issue single voucher.
 * Body: { data: { beneficiary_id, programme_id, amount, expiry_date } } (Open Banking root) or legacy flat body.
 * Roles: ketchup_ops (RBAC enforced: vouchers.issue permission).
 * Secured: RBAC, rate limit, optional Idempotency-Key; response aligned with Open Banking (data root).
 */

import { NextRequest } from "next/server";
import { issueVoucher } from "@/lib/services/voucher-service";
import { jsonSuccess, jsonErrorOpenBanking } from "@/lib/api-response";
import { validateBody, schemas } from "@/lib/validate";
import { logger } from "@/lib/logger";
import { guardMutation } from "@/lib/api-security";
import { parseRootData } from "@/lib/open-banking";
import { requirePermission } from "@/lib/require-permission";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";

const ROUTE = "POST /api/v1/vouchers/issue";

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require vouchers.issue permission (SEC-001)
    const auth = await requirePermission(request, "vouchers.issue", ROUTE);
    if (auth) return auth;

    const guard = guardMutation(request, {
      rateLimitKey: "vouchers:issue",
      rateLimitMax: 30,
      requireJsonBody: true,
      route: ROUTE,
    });
    if (!guard.ok) return guard.response;

    const body = await request.json().catch(() => ({}));
    const parsed = parseRootData<Record<string, unknown>>(body);
    const raw =
      !("error" in parsed) && parsed.data != null && typeof parsed.data === "object"
        ? (parsed.data as Record<string, unknown>)
        : (body as Record<string, unknown>);

    const validation = validateBody(schemas.voucherIssue, raw);
    if (!validation.success) {
      return jsonErrorOpenBanking(
        validation.error,
        "ValidationError",
        400,
        { field: validation.details?.field as string }
      );
    }
    const { beneficiary_id, programme_id, amount, expiry_date } = validation.data;

    const result = await issueVoucher({
      beneficiaryId: beneficiary_id,
      programmeId: programme_id,
      amount,
      expiryDate: expiry_date,
    });

    // Audit logging: Critical financial operation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'voucher.issue',
        resourceType: 'voucher',
        resourceId: result.id,
        metadata: {
          beneficiaryId: beneficiary_id,
          programmeId: programme_id,
          amount: amount.toString(),
          expiryDate: expiry_date,
        },
      });
    }

    return jsonSuccess(
      {
        id: result.id,
        status: result.status,
        requested_at: result.issued_at,
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Issue voucher error", {
      error: err,
    });
    return jsonErrorOpenBanking("Internal server error", "InternalError", 500, { route: ROUTE });
  }
}
