/**
 * POST /api/v1/mobile/fineract/vouchers/[id]/redeem – Redeem voucher in Fineract (flow orchestration).
 * Auth: X-API-Key header (Buffr API key required - BUFFR_API_KEY env var).
 * Location: src/app/api/v1/mobile/fineract/vouchers/[id]/redeem/route.ts
 * Purpose: After Token Vault (or bank) success, call Fineract to update ledger. FINERACT_PRD_ALIGNMENT.md §6.
 * Body: { redemptionMethod (1–4), redemptionDate?, description? }. id = Fineract voucher ID.
 * Returns 503 when Fineract not configured. Rate limited (10/min per API key).
 */

import { NextRequest } from "next/server";
import { jsonSuccess, jsonErrors, metaWithImplementationConfidence, jsonError } from "@/lib/api-response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { parseRootData } from "@/lib/open-banking";
import {
  redeemVoucher,
  FineractNotConfigured,
  type RedemptionMethod,
} from "@/lib/fineract-client";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ROUTE = "POST /api/v1/mobile/fineract/vouchers/[id]/redeem";

const bodySchema = z.object({
  redemptionMethod: z.number().int().min(1).max(4),
  redemptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description: z.string().max(500).optional(),
  transactionId: z.string().max(100).optional(),
  trustAccountDebited: z.boolean().optional(),
  bankAccountEncrypted: z.string().max(500).optional(),
  merchantId: z.string().max(100).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // API Key authentication: Verify X-API-Key header matches BUFFR_API_KEY (SEC-001)
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.BUFFR_API_KEY;
    
    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      return jsonError(
        "Unauthorized - Invalid or missing API key", 
        "Unauthorized", 
        undefined, 
        401, 
        ROUTE
      );
    }

    // Rate limiting: VOUCHER_ISSUE preset (10/min per API key) (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.VOUCHER_ISSUE);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const fineractVoucherId = parseInt(id, 10);
    if (Number.isNaN(fineractVoucherId) || fineractVoucherId < 1) {
      return jsonErrors(
        [{ code: "ValidationError", message: "Invalid voucher id", field: "id" }],
        400
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = parseRootData<Record<string, unknown>>(body);
    const raw =
      !("error" in parsed) && parsed.data != null && typeof parsed.data === "object"
        ? (parsed.data as Record<string, unknown>)
        : (body as Record<string, unknown>);

    const result = bodySchema.safeParse(raw);
    if (!result.success) {
      const first = result.error.issues[0];
      return jsonErrors(
        [
          {
            code: "ValidationError",
            message: first?.message ?? "Validation failed",
            field: first?.path?.[0] as string | undefined,
          },
        ],
        400
      );
    }

    const { redemptionMethod, redemptionDate, description, transactionId, trustAccountDebited, bankAccountEncrypted, merchantId } = result.data;
    const finRes = await redeemVoucher(fineractVoucherId, {
      redemptionMethod: redemptionMethod as RedemptionMethod,
      redemptionDate,
      description,
      transactionId,
      trustAccountDebited,
      bankAccountEncrypted,
      merchantId,
    });

    if (!finRes.ok) {
      if (finRes.status >= 500) {
        return jsonErrors(
          [{ code: "FineractError", message: finRes.error ?? "Fineract request failed." }],
          finRes.status,
          { route: ROUTE }
        );
      }
      return jsonErrors(
        [{ code: "FineractError", message: finRes.error ?? "Fineract rejected the request." }],
        finRes.status
      );
    }

    return jsonSuccess({
      redeemed: true,
      fineractVoucherId,
      resourceId: finRes.resourceId,
    }, { meta: metaWithImplementationConfidence() });
  } catch (err) {
    if (err instanceof FineractNotConfigured) {
      return jsonErrors(
        [
          {
            code: "ServiceUnavailable",
            message: "Fineract is not configured. Set FINERACT_BASE_URL to enable voucher redemption.",
          },
        ],
        503,
        { route: ROUTE }
      );
    }
    const message = err instanceof Error ? err.message : "Redeem failed";
    logger.error(ROUTE, message, { error: err });
    return jsonErrors(
      [{ code: "InternalError", message: "Unable to redeem voucher. Please try again." }],
      500,
      { route: ROUTE }
    );
  }
}
