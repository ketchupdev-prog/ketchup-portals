/**
 * GET /api/v1/analytics/dau – Daily active users from user_sessions (distinct user_id per day).
 * Query: days (optional, 1–30, default 7).
 */

import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSessions } from "@/db/schema";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/analytics/dau";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(30, Math.max(1, parseInt(searchParams.get("days") ?? "7", 10) || 7));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setUTCHours(0, 0, 0, 0);

    const rows = await db
      .select({
        date: sql<string>`(${userSessions.loginAt})::date::text`,
        count: sql<number>`count(distinct ${userSessions.userId})::int`,
      })
      .from(userSessions)
      .where(sql`(${userSessions.loginAt})::date >= ${startDate.toISOString().slice(0, 10)}::date`)
      .groupBy(sql`(${userSessions.loginAt})::date`)
      .orderBy(sql`(${userSessions.loginAt})::date`);

    const byDate = new Map(rows.map((r) => [r.date, r.count]));
    const data = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, count: byDate.get(dateStr) ?? 0 };
    });

    return Response.json({ data });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
