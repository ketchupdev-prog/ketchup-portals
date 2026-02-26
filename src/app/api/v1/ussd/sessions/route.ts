/**
 * GET /api/v1/ussd/sessions – List USSD sessions.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ussdSessions, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";

const basePath = "/api/v1/ussd/sessions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const userId = searchParams.get("user_id");

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: ussdSessions.id,
          userId: ussdSessions.userId,
          sessionData: ussdSessions.sessionData,
          createdAt: ussdSessions.createdAt,
          fullName: users.fullName,
          phone: users.phone,
        })
        .from(ussdSessions)
        .leftJoin(users, eq(ussdSessions.userId, users.id))
        .where(userId ? eq(ussdSessions.userId, userId) : undefined)
        .orderBy(desc(ussdSessions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(ussdSessions)
        .where(userId ? eq(ussdSessions.userId, userId) : undefined),
    ]);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(basePath, page, limit, totalPages, userId ? { user_id: userId } : undefined);
    const data = rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      full_name: r.fullName,
      phone: r.phone,
      session_data: r.sessionData,
      created_at: r.createdAt.toISOString(),
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    console.error("GET /api/v1/ussd/sessions error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
