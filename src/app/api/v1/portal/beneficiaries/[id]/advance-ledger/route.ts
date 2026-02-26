/**
 * GET /api/v1/portal/beneficiaries/:id/advance-ledger – Beneficiary advance ledger (PRD §3.3.11).
 */

import { NextRequest } from "next/server";
import { getBeneficiaryAdvanceLedger } from "@/lib/services/duplicate-redemption-service";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/portal/beneficiaries/[id]/advance-ledger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
