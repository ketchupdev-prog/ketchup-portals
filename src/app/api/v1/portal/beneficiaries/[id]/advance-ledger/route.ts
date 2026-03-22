/**
 * GET /api/v1/portal/beneficiaries/:id/advance-ledger – Beneficiary advance ledger (PRD §3.3.11).
 * Roles: ketchup_* (RBAC enforced: beneficiaries.list permission).
 */

import { NextRequest } from "next/server";
import { getBeneficiaryAdvanceLedger } from "@/lib/services/duplicate-redemption-service";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/portal/beneficiaries/[id]/advance-ledger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require beneficiaries.list permission (SEC-001)
    const auth = await requirePermission(request, "beneficiaries.list", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const result = await getBeneficiaryAdvanceLedger(id);
    return Response.json({
      advances: result.advances,
      total_outstanding_nad: result.total_outstanding_nad,
    });
  } catch (err) {
    logger.error(
      ROUTE,
      err instanceof Error ? err.message : "Advance ledger error",
      { error: err }
    );
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
