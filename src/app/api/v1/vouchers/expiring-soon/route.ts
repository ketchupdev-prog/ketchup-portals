/**
 * GET /api/v1/vouchers/expiring-soon – Vouchers expiring in next 7 days (status=available).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vouchers, users, programmes } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
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
    console.error("GET /api/v1/vouchers/expiring-soon error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
