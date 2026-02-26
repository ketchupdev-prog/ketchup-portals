/**
 * GET /api/v1/programmes/:id/report – Generate PDF report (stub; returns JSON summary).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { programmes, vouchers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prog = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1).then((r) => r[0]);
    if (!prog) return jsonError("Programme not found", "NotFound", { id }, 404);
    const stats = await db
      .select({
        total: sql<number>`count(*)::int`,
        redeemed: sql<number>`count(*) filter (where status = 'redeemed')::int`,
        available: sql<number>`count(*) filter (where status = 'available')::int`,
        expired: sql<number>`count(*) filter (where status = 'expired')::int`,
      })
      .from(vouchers)
      .where(eq(vouchers.programmeId, id))
      .then((r) => r[0]);
    return Response.json({
      programme_id: id,
      programme_name: prog.name,
      allocated_budget: prog.allocatedBudget,
      spent_to_date: prog.spentToDate,
      vouchers_total: stats?.total ?? 0,
      vouchers_redeemed: stats?.redeemed ?? 0,
      vouchers_available: stats?.available ?? 0,
      vouchers_expired: stats?.expired ?? 0,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("GET /api/v1/programmes/[id]/report error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
