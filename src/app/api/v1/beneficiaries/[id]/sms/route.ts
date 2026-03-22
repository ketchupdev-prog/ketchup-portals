/**
 * POST /api/v1/beneficiaries/:id/sms – Queue a single SMS to a beneficiary.
 * Body: { data: { message?: string } } or flat { message? }. Optional message; default proof-of-life reminder.
 * Roles: ketchup_support, ketchup_ops (RBAC enforced: beneficiaries.sms permission).
 * Open Banking–aligned: root { data } response and { errors } for 4xx/5xx.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, smsQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonSuccess, jsonErrorOpenBanking } from "@/lib/api-response";
import { validateId, validateBody, schemas } from "@/lib/validate";
import { logger } from "@/lib/logger";
import { parseRootData } from "@/lib/open-banking";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

const ROUTE = "POST /api/v1/beneficiaries/[id]/sms";

const DEFAULT_REMINDER =
  "Ketchup SmartPay: Please complete your proof-of-life at an agent. Reply STOP to opt out of SMS.";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require beneficiaries.sms permission (SEC-001)
    const auth = await requirePermission(request, "beneficiaries.sms", ROUTE);
    if (auth) return auth;

    // Rate limiting: SMS operations (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.BULK_SMS);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const idValidation = validateId(id);
    if (!idValidation.success) {
      return jsonErrorOpenBanking(idValidation.error, "ValidationError", 400, { field: idValidation.details?.field as string });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = parseRootData<Record<string, unknown>>(body);
    const raw = !("error" in parsed) && parsed.data != null && typeof parsed.data === "object"
      ? (parsed.data as Record<string, unknown>)
      : (body as Record<string, unknown>);
    const msgValidation = validateBody(schemas.beneficiarySms, raw);
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
      return jsonErrorOpenBanking("Beneficiary not found", "NotFound", 404, { field: "id" });
    }

    if (user.smsOptOut) {
      return jsonErrorOpenBanking("Beneficiary has opted out of SMS", "ValidationError", 400, { field: "id" });
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
      return jsonErrorOpenBanking("Failed to queue SMS", "InternalError", 500, { route: ROUTE });
    }

    return jsonSuccess(
      { id: inserted.id, status: inserted.status, queued: true },
      { status: 201 }
    );
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonErrorOpenBanking("Internal server error", "InternalError", 500, { route: ROUTE });
  }
}
