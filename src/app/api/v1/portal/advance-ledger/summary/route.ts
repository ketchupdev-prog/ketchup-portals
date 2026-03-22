/**
 * GET /api/v1/portal/advance-ledger/summary – Programme-level advance summary (PRD §3.3.11).
 * Roles: ketchup_* (RBAC enforced: dashboard.summary OR duplicate_redemptions.list permission).
 * Query: programme_id, cycle_date (cycle_date optional, for future use).
 */

import { NextRequest } from "next/server";
import { getAdvanceLedgerSummary } from "@/lib/services/duplicate-redemption-service";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requireAnyPermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/portal/advance-ledger/summary";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require dashboard.summary OR duplicate_redemptions.list permission (SEC-001)
    const auth = await requireAnyPermission(
      request,
      ["dashboard.summary", "duplicate_redemptions.list"],
      ROUTE
    );
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const programmeId = searchParams.get("programme_id") ?? undefined;

    const result = await getAdvanceLedgerSummary(programmeId ?? undefined);
    return Response.json({
      total_outstanding: result.total_outstanding,
      recovery_rate: result.recovery_rate,
      count_beneficiaries_affected: result.count_beneficiaries_affected,
      total_duplicates_detected: result.total_duplicates_detected,
      total_over_disbursed_nad: result.total_over_disbursed_nad,
    });
  } catch (err) {
    logger.error(
      ROUTE,
      err instanceof Error ? err.message : "Advance ledger summary error",
      { error: err }
    );
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
