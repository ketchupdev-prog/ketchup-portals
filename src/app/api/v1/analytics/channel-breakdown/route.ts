/**
 * GET /api/v1/analytics/channel-breakdown – App vs USSD from user_sessions and ussd_sessions.
 * Query: days (optional, 1–90, default 30).
 */

import { NextRequest } from "next/server";
import { gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSessions, ussdSessions } from "@/db/schema";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "GET /api/v1/analytics/channel-breakdown";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "30", 10) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [appResult, ussdResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userSessions)
        .where(gte(userSessions.loginAt, since)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(ussdSessions)
        .where(gte(ussdSessions.createdAt, since)),
    ]);

    const appCount = appResult[0]?.count ?? 0;
    const ussdCount = ussdResult[0]?.count ?? 0;
    const total = appCount + ussdCount;
    const appPct = total > 0 ? Math.round((appCount / total) * 100) : 0;
    const ussdPct = total > 0 ? Math.round((ussdCount / total) * 100) : 0;

    return Response.json({
      data: [
        { channel: "app", count: appCount, percentage: appPct },
        { channel: "ussd", count: ussdCount, percentage: ussdPct },
      ],
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
