/**
 * GET /api/v1/ussd/sessions/:id – USSD session detail.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ussdSessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db
      .select({
        session: ussdSessions,
        fullName: users.fullName,
        phone: users.phone,
      })
      .from(ussdSessions)
      .leftJoin(users, eq(ussdSessions.userId, users.id))
      .where(eq(ussdSessions.id, id))
      .limit(1)
      .then((r) => r[0]);
    if (!row) return jsonError("Session not found", "NotFound", { id }, 404);
    const s = row.session;
    return Response.json({
      id: s.id,
      user_id: s.userId,
      full_name: row.fullName,
      phone: row.phone,
      session_data: s.sessionData,
      created_at: s.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/v1/ussd/sessions/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
