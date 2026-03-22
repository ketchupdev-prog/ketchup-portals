/**
 * POST /api/v1/sms/process – Process pending SMS queue (call from Vercel Cron or external worker).
 * Security: CRON_SECRET header validation (not RBAC - internal CRON job only).
 * No rate limiting (internal process), no audit logging (automated).
 * Fetches up to N pending rows, calls sendSms(), updates status.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { smsQueue } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { sendSms } from "@/lib/services/sms";
import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const ROUTE = "POST /api/v1/sms/process";
const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    // CRON secret verification: Verify x-cron-secret header (SEC-001)
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      logger.warn(ROUTE, "Invalid CRON secret", { hasSecret: !!cronSecret });
      return jsonError("Unauthorized", "Unauthorized", undefined, 401, ROUTE);
    }

    const pending = await db
      .select()
      .from(smsQueue)
      .where(
        and(
          eq(smsQueue.status, "pending"),
          lt(smsQueue.attempts, MAX_ATTEMPTS)
        )
      )
      .orderBy(smsQueue.createdAt)
      .limit(BATCH_SIZE);

    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (const row of pending) {
      processed++;
      const result = await sendSms({
        to: row.recipientPhone,
        message: row.message,
        reference: row.id,
      });

      if (result.success) {
        await db
          .update(smsQueue)
          .set({
            status: "sent",
            providerMessageId: result.messageId ?? null,
            sentAt: new Date(),
            attempts: (row.attempts ?? 0) + 1,
            lastAttemptAt: new Date(),
            errorMessage: null,
          })
          .where(eq(smsQueue.id, row.id));
        sent++;
      } else {
        const attempts = (row.attempts ?? 0) + 1;
        await db
          .update(smsQueue)
          .set({
            status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
            attempts,
            lastAttemptAt: new Date(),
            errorMessage: result.error ?? null,
          })
          .where(eq(smsQueue.id, row.id));
        failed++;
      }
    }

    return Response.json({
      processed,
      sent,
      failed,
      message: `Processed ${processed} (sent: ${sent}, failed: ${failed}).`,
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
