/**
 * GET /api/v1/vouchers/expiring-soon – Vouchers expiring in next 7 days (status=available).
 * Roles: ketchup_*, gov_* (RBAC enforced: vouchers.list permission).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vouchers, users, programmes } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/vouchers/expiring-soon";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require vouchers.list permission (SEC-001)
    const auth = await requirePermission(request, "vouchers.list", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const rows = await db
      .select({
        id: vouchers.id,
        amount: vouchers.amount,
        status: vouchers.status,
        expiryDate: vouchers.expiryDate,
        issuedAt: vouchers.issuedAt,
        beneficiaryName: users.fullName,
        programmeName: programmes.name,
      })
      .from(vouchers)
      .leftJoin(users, eq(vouchers.beneficiaryId, users.id))
      .leftJoin(programmes, eq(vouchers.programmeId, programmes.id))
      .where(
        and(
          eq(vouchers.status, "available"),
          gte(vouchers.expiryDate, now.toISOString().slice(0, 10)),
          lte(vouchers.expiryDate, in7.toISOString().slice(0, 10))
        )
      )
      .orderBy(desc(vouchers.expiryDate));

    const data = rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      expiry_date: r.expiryDate,
      issued_at: r.issuedAt.toISOString(),
      beneficiary_name: r.beneficiaryName ?? null,
      programme_name: r.programmeName ?? null,
    }));

    return Response.json({ data });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "List expiring vouchers error", {
      error: err,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
