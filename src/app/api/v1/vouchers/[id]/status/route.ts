/**
 * GET /api/v1/vouchers/:id/status – Real-time voucher status for pre-redemption check (PRD §3.3.11).
 * Returns status (available | pending | redeemed) and optional lock fields. Used by POS/devices before processing.
 * Roles: ketchup_*, gov_* (RBAC enforced: vouchers.list permission).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vouchers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/vouchers/[id]/status";

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
        status: vouchers.status,
      })
      .from(vouchers)
      .where(eq(vouchers.id, id))
      .limit(1)
      .then((r) => r[0]);

    if (!row)
      return jsonError("Voucher not found", "NotFound", { id }, 404, ROUTE);

    return Response.json({
      status: row.status,
      locked_by_device_id: null,
      lock_expires_at: null,
    });
  } catch (err) {
    logger.error(
      ROUTE,
      err instanceof Error ? err.message : "Voucher status error",
      { error: err }
    );
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
