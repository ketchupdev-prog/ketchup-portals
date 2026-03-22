/**
 * GET /api/v1/analytics/app-users – List app users (from user_sessions).
 * Roles: ketchup_*, gov_* (RBAC enforced: dashboard.summary permission).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userSessions, users } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { parsePagination, paginationLinks, jsonPaginated, jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "GET /api/v1/analytics/app-users";
const basePath = "/api/v1/analytics/app-users";

export async function GET(request: NextRequest) {
  try {
    // RBAC: Require dashboard.summary permission (SEC-001)
    const auth = await requirePermission(request, "dashboard.summary", ROUTE);
    if (auth) return auth;

    // Rate limiting: Read-only endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const rows = await db
      .select({
        userId: userSessions.userId,
        loginAt: userSessions.loginAt,
        deviceOs: userSessions.deviceOs,
        appVersion: userSessions.appVersion,
        fullName: users.fullName,
        phone: users.phone,
      })
      .from(userSessions)
      .leftJoin(users, eq(userSessions.userId, users.id))
      .orderBy(desc(userSessions.loginAt))
      .limit(limit)
      .offset(offset);
    const countRows = await db.select({ count: sql<number>`count(distinct ${userSessions.userId})::int` }).from(userSessions);
    const totalRecords = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const meta = { totalRecords, totalPages, page, limit };
    const links = paginationLinks(basePath, page, limit, totalPages);
    const data = rows.map((r) => ({
      user_id: r.userId,
      full_name: r.fullName,
      phone: r.phone,
      login_at: r.loginAt.toISOString(),
      device_os: r.deviceOs,
      app_version: r.appVersion,
    }));
    return jsonPaginated(data, meta, links);
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
