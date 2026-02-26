/**
 * GET /api/v1/notifications – List in-app notifications for a portal user.
 * Query: user_id (required for now; from session when auth wired), limit, unread_only.
 * Response: { data: Notification[], meta: { total, unread_count } }
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inAppNotifications } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { parsePagination, jsonError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    if (!userId) {
      return jsonError("user_id is required", "ValidationError", { field: "user_id" }, 400);
    }
    const unreadOnly = searchParams.get("unread_only") === "true";
    const { limit, offset } = parsePagination(searchParams);

    const conditions = [eq(inAppNotifications.userId, userId)];
    if (unreadOnly) conditions.push(eq(inAppNotifications.read, false));
    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [rows, unreadRow] = await Promise.all([
      db
        .select()
        .from(inAppNotifications)
        .where(whereClause)
        .orderBy(desc(inAppNotifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(inAppNotifications)
        .where(and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.read, false))),
    ]);

    const unreadCount = unreadRow[0]?.count ?? 0;
    const data = rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      link: r.link,
      read: r.read,
      created_at: r.createdAt.toISOString(),
    }));

    return Response.json({
      data,
      meta: { total: rows.length, unread_count: unreadCount },
    });
  } catch (err) {
    console.error("GET /api/v1/notifications error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
