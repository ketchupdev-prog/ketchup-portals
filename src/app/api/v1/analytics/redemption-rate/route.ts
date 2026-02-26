/**
 * GET /api/v1/analytics/redemption-rate – Redemption rate by period.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vouchers } from "@/db/schema";
import { sql } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const rows = await db
      .select({
        total: sql<number>`count(*)::int`,
        redeemed: sql<number>`count(*) filter (where status = 'redeemed')::int`,
      })
      .from(vouchers);
    const r = rows[0];
    const total = r?.total ?? 0;
    const redeemed = r?.redeemed ?? 0;
    const rate = total > 0 ? (redeemed / total) * 100 : 0;
    return Response.json({ total, redeemed, redemption_rate_percent: Math.round(rate * 100) / 100 });
  } catch (err) {
    console.error("GET /api/v1/analytics/redemption-rate error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
