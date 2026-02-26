/**
 * POST /api/v1/beneficiaries/bulk-sms – Queue SMS to multiple beneficiaries.
 * Body: { beneficiary_ids: string[], message?: string }
 * Skips opted-out users. Roles: ketchup_ops (no RBAC yet).
 * Rate limited per IP (docs/SECURITY.md §4).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, smsQueue } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { validateBody, schemas } from "@/lib/validate";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

const ROUTE = "POST /api/v1/beneficiaries/bulk-sms";
const SMS_RATE_LIMIT = 20; // requests per minute per IP
const DEFAULT_BULK_MESSAGE =
  "Ketchup SmartPay: Please complete your proof-of-life at an agent. Reply STOP to opt out of SMS.";

export async function POST(request: NextRequest) {
  try {
    const key = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`bulk-sms:${key}`, SMS_RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return Response.json(
        { error: "Too many SMS requests", code: "RateLimitExceeded" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateBody(schemas.bulkSms, body);
    if (!validation.success) {
      return jsonError(validation.error, "ValidationError", validation.details, 400);
    }
    const { beneficiary_ids: ids, message: msg } = validation.data;
    const message = msg?.trim() || DEFAULT_BULK_MESSAGE;
    const uniqueIds = [...new Set(ids)].slice(0, 500);

    const eligible = await db
      .select({ id: users.id, phone: users.phone, smsOptOut: users.smsOptOut })
      .from(users)
      .where(inArray(users.id, uniqueIds));

    const toSend = eligible.filter((u) => u.smsOptOut !== true);

    if (toSend.length === 0) {
      return Response.json({
        queued: 0,
        skipped: uniqueIds.length,
        message: "No eligible beneficiaries (all opted out or not found).",
      });
    }

    const rows = toSend.map((u) => ({
      recipientPhone: u.phone,
      message,
      referenceId: u.id,
      referenceType: "beneficiary" as const,
    }));

    await db.insert(smsQueue).values(rows);

    return Response.json({
      queued: toSend.length,
      skipped: uniqueIds.length - toSend.length,
      message: `${toSend.length} SMS queued.`,
    }, { status: 201 });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
