/**
 * POST /api/v1/webhooks/sms/delivery – Provider delivery receipt (DLR) webhook.
 * Payload format is provider-specific; map messageId/status to sms_queue update.
 * Secured by SMS_WEBHOOK_SECRET (verify signature or token in body/header).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsQueue } from "@/db/schema";
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
    const messageId = (body.messageId ?? body.message_id ?? body.id) as string | undefined;
    const status = String(body.status ?? body.delivery_status ?? "").toUpperCase();
    const description = (body.description ?? body.error_message ?? body.error) as string | undefined;

    if (!messageId) {
      return jsonError("messageId (or message_id) required", "ValidationError", undefined, 400);
    }

    const delivered = status === "DELIVERED" || status === "SUCCESS" || status === "D";
    await db
      .update(smsQueue)
      .set({
        status: delivered ? "delivered" : "failed",
        deliveredAt: delivered ? new Date() : null,
        errorMessage: description ?? null,
      })
      .where(eq(smsQueue.providerMessageId, messageId));

    return Response.json({ received: true });
  } catch (err) {
    console.error("POST /api/v1/webhooks/sms/delivery error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
