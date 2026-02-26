/**
 * GET /api/v1/beneficiaries/unverified – Unverified (proof-of-life overdue).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { lt, desc, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/beneficiaries/unverified";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          phone: users.phone,
          region: users.region,
          walletStatus: users.walletStatus,
          proofOfLifeDueDate: users.proofOfLifeDueDate,
        })
        .from(users)
        .where(lt(users.proofOfLifeDueDate, today))
        .orderBy(desc(users.proofOfLifeDueDate))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(lt(users.proofOfLifeDueDate, today)),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(basePath, page, limit, totalPages);
    const data = rows.map((r) => ({
      id: r.id,
      full_name: r.fullName,
      phone: r.phone,
      region: r.region,
      wallet_status: r.walletStatus,
      proof_of_life_due_date: r.proofOfLifeDueDate?.toISOString() ?? null,
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/beneficiaries/unverified error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
