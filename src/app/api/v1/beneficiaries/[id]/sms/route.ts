/**
 * POST /api/v1/beneficiaries/:id/sms – Queue a single SMS to a beneficiary.
 * Body: { message?: string } (optional; default proof-of-life reminder).
 * Roles: ketchup_support, ketchup_ops (no RBAC yet).
 * Rate limited per IP (docs/SECURITY.md §4).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, smsQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { validateId, validateBody, schemas } from "@/lib/validate";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

const ROUTE = "POST /api/v1/beneficiaries/[id]/sms";
const SMS_RATE_LIMIT = 20; // requests per minute per IP
const DEFAULT_REMINDER =
  "Ketchup SmartPay: Please complete your proof-of-life at an agent. Reply STOP to opt out of SMS.";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const key = getClientKey(request);
    const { allowed, resetAt } = checkRateLimit(`sms:${key}`, SMS_RATE_LIMIT);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return Response.json(
        { error: "Too many SMS requests", code: "RateLimitExceeded" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { id } = await params;
    const idValidation = validateId(id);
    if (!idValidation.success) {
      return jsonError(idValidation.error, "ValidationError", idValidation.details, 400);
    }
    const body = await request.json().catch(() => ({}));
    const msgValidation = validateBody(schemas.beneficiarySms, body);
    const message = msgValidation.success && msgValidation.data.message
      ? msgValidation.data.message
      : DEFAULT_REMINDER;

    const user = await db
      .select({ id: users.id, phone: users.phone, smsOptOut: users.smsOptOut })
      .from(users)
      .where(eq(users.id, idValidation.data))
      .limit(1)
      .then((r) => r[0]);

    if (!user) {
      return jsonError("Beneficiary not found", "NotFound", { id }, 404);
    }

    if (user.smsOptOut) {
      return jsonError("Beneficiary has opted out of SMS", "ValidationError", { id }, 400);
    }

    const [inserted] = await db
      .insert(smsQueue)
      .values({
        recipientPhone: user.phone,
        message,
        referenceId: idValidation.data,
        referenceType: "beneficiary",
      })
      .returning({ id: smsQueue.id, status: smsQueue.status });

    if (!inserted) {
      return jsonError("Failed to queue SMS", "InternalError", undefined, 500);
    }

    return Response.json(
      { id: inserted.id, status: inserted.status, queued: true },
      { status: 201 }
    );
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
