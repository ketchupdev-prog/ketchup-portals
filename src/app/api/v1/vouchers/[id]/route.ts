/**
 * GET /api/v1/vouchers/:id – Voucher detail.
 * Roles: ketchup_*, gov_* (RBAC enforced: vouchers.list permission).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vouchers, users, programmes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/vouchers/[id]";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require vouchers.list permission (SEC-001)
    const auth = await requirePermission(request, "vouchers.list", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const row = await db
      .select({
        v: vouchers,
        beneficiaryName: users.fullName,
        programmeName: programmes.name,
      })
      .from(vouchers)
      .leftJoin(users, eq(vouchers.beneficiaryId, users.id))
      .leftJoin(programmes, eq(vouchers.programmeId, programmes.id))
      .where(eq(vouchers.id, id))
      .limit(1)
      .then((r) => r[0]);

    if (!row) return jsonError("Voucher not found", "NotFound", { id }, 404, ROUTE);

    const v = row.v;
    return Response.json({
      id: v.id,
      beneficiary_id: v.beneficiaryId,
      programme_id: v.programmeId,
      beneficiary_name: row.beneficiaryName ?? null,
      programme_name: row.programmeName ?? null,
      amount: v.amount,
      status: v.status,
      issued_at: v.issuedAt.toISOString(),
      redeemed_at: v.redeemedAt?.toISOString() ?? null,
      expiry_date: v.expiryDate,
      loan_deduction: v.loanDeduction,
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Get voucher error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
