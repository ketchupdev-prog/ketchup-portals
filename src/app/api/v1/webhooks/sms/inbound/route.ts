/**
 * POST /api/v1/webhooks/sms/inbound – Provider inbound SMS webhook (e.g. STOP opt-out).
 * Payload: from (phone), text. If text is STOP, set user.sms_opt_out = true.
 * Secured by SMS_WEBHOOK_SECRET.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SMS_WEBHOOK_SECRET;
    if (secret) {
      const auth = request.headers.get("x-webhook-secret") ?? request.headers.get("authorization");
      const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : auth;
      if (token !== secret) {
        return jsonError("Unauthorized", "Unauthorized", undefined, 401);
      }
    }

    const payload = await request.json().catch(() => ({}));
    const body = payload as Record<string, unknown>;
    const from = (body.from ?? body.sender ?? body.phone) as string | undefined;
    const text = String(body.text ?? body.message ?? body.body ?? "").trim().toUpperCase();

    if (!from) {
      return jsonError("from (or sender) required", "ValidationError", undefined, 400);
    }

    const normalizedFrom = from.replace(/\s/g, "");
    if (text === "STOP" || text === "UNSUBSCRIBE" || text === "END") {
      await db
        .update(users)
        .set({ smsOptOut: true, updatedAt: new Date() })
        .where(eq(users.phone, normalizedFrom));
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/v1/webhooks/sms/inbound error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
