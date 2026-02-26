/**
 * GET /api/v1/advance-ledger/summary – Programme-level advance ledger summary (PRD §3.3.11).
 * Returns aggregate stats: total outstanding, recovery rate, count of beneficiaries affected.
 * Query: programme_id (optional) – filter by programme.
 * Roles: ketchup_ops, ketchup_compliance, ketchup_finance, gov_manager, gov_auditor.
 */

import { NextRequest } from "next/server";
import { getAdvanceLedgerSummary } from "@/lib/services/duplicate-redemption-service";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/advance-ledger/summary";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programmeId = searchParams.get("programme_id") ?? undefined;

    const summary = await getAdvanceLedgerSummary(programmeId);
    return Response.json(summary);
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Summary error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
