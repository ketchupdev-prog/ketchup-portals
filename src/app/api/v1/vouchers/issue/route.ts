/**
 * POST /api/v1/vouchers/issue – Issue single voucher.
 * Body: { beneficiary_id, programme_id, amount, expiry_date }.
 * Roles: ketchup_ops.
 */

import { NextRequest } from "next/server";
import { issueVoucher } from "@/lib/services/voucher-service";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "POST /api/v1/vouchers/issue";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const beneficiaryId = body.beneficiary_id;
    const programmeId = body.programme_id;
    const amount = body.amount;
    const expiryDate = body.expiry_date;

    if (!beneficiaryId || !programmeId || amount == null || !expiryDate) {
      return jsonError(
        "beneficiary_id, programme_id, amount and expiry_date are required",
        "ValidationError",
        { field: "body", message: "Missing required fields" },
        400
      );
    }

    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      return jsonError(
        "Amount must be a positive number",
        "ValidationError",
        { field: "amount", message: "Amount must be positive" },
        400
      );
    }

    const result = await issueVoucher({
      beneficiaryId,
      programmeId,
      amount: numAmount,
      expiryDate,
    });

    return Response.json(
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
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
