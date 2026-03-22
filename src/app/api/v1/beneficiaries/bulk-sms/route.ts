/**
 * POST /api/v1/beneficiaries/bulk-sms – Queue SMS to multiple beneficiaries.
 * Body: { data: { beneficiary_ids: string[], message?: string } } or flat. Skips opted-out users.
 * Roles: ketchup_ops (RBAC enforced: beneficiaries.sms permission).
 * Open Banking–aligned: root { data } and { errors }.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, smsQueue } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { jsonSuccess, jsonErrorOpenBanking } from "@/lib/api-response";
import { validateBody, schemas } from "@/lib/validate";
import { logger } from "@/lib/logger";
import { parseRootData } from "@/lib/open-banking";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";

const ROUTE = "POST /api/v1/beneficiaries/bulk-sms";

const DEFAULT_BULK_MESSAGE =
  "Ketchup SmartPay: Please complete your proof-of-life at an agent. Reply STOP to opt out of SMS.";

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require beneficiaries.sms permission (SEC-001)
    const auth = await requirePermission(request, "beneficiaries.sms", ROUTE);
    if (auth) return auth;

    // Rate limiting: Bulk SMS operations (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.BULK_SMS);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const parsed = parseRootData<Record<string, unknown>>(body);
    const raw = !("error" in parsed) && parsed.data != null && typeof parsed.data === "object"
      ? (parsed.data as Record<string, unknown>)
      : (body as Record<string, unknown>);
    const validation = validateBody(schemas.bulkSms, raw);
    if (!validation.success) {
      return jsonErrorOpenBanking(
        validation.error,
        "ValidationError",
        400,
        { field: validation.details?.field as string }
      );
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
      return jsonSuccess(
        {
          queued: 0,
          skipped: uniqueIds.length,
          message: "No eligible beneficiaries (all opted out or not found).",
        },
        { status: 200 }
      );
    }

    const rows = toSend.map((u) => ({
      recipientPhone: u.phone,
      message,
      referenceId: u.id,
      referenceType: "beneficiary" as const,
    }));

    await db.insert(smsQueue).values(rows);

    // Audit logging: Bulk SMS operation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'beneficiary.sms_sent',
        resourceType: 'beneficiary',
        resourceId: uniqueIds[0],
        metadata: {
          count: toSend.length,
          skipped: uniqueIds.length - toSend.length,
          totalRequested: uniqueIds.length,
          message: message.substring(0, 100),
        },
      });
    }

    return jsonSuccess(
      {
        queued: toSend.length,
        skipped: uniqueIds.length - toSend.length,
        message: `${toSend.length} SMS queued.`,
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Internal server error", {
      name: err instanceof Error ? err.name : undefined,
    });
    return jsonErrorOpenBanking("Internal server error", "InternalError", 500, { route: ROUTE });
  }
}
