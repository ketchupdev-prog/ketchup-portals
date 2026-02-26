/**
 * GET /api/v1/beneficiaries/{id}/advance-ledger – Beneficiary advance ledger (PRD §3.3.11).
 * Returns all outstanding and recovered advances for this beneficiary.
 * Roles: ketchup_ops, ketchup_compliance, ketchup_finance.
 */

import { NextRequest } from "next/server";
import { getBeneficiaryAdvanceLedger } from "@/lib/services/duplicate-redemption-service";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/beneficiaries/[id]/advance-ledger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getBeneficiaryAdvanceLedger(id);
    return Response.json({
      beneficiary_id: id,
      ...result,
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Advance ledger error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
