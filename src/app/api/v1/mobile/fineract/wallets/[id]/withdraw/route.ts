/**
 * POST /api/v1/mobile/fineract/wallets/[id]/withdraw – Withdraw from wallet in Fineract (flow orchestration).
 * Auth: X-API-Key header (Buffr API key required - BUFFR_API_KEY env var).
 * Location: src/app/api/v1/mobile/fineract/wallets/[id]/withdraw/route.ts
 * Purpose: After bank PIS success (or till/agent/merchant/ATM) call Fineract to debit wallet. FINERACT_PRD_ALIGNMENT.md §6.
 * Body: { amount, transactionDate?, reference?, description? }. id = Fineract wallet ID.
 * Returns 503 when Fineract not configured. Rate limited (50/min per API key).
 */

import { NextRequest } from "next/server";
import { jsonSuccess, jsonErrors, metaWithImplementationConfidence, jsonError } from "@/lib/api-response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { parseRootData } from "@/lib/open-banking";
import {
  withdrawFromWallet,
  FineractNotConfigured,
} from "@/lib/fineract-client";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ROUTE = "POST /api/v1/mobile/fineract/wallets/[id]/withdraw";

const bodySchema = z.object({
  amount: z.string().min(1).max(50),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  channel: z.string().max(50).optional(),
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

    // Rate limiting: ADMIN preset (50/min per API key) (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const fineractWalletId = parseInt(id, 10);
    if (Number.isNaN(fineractWalletId) || fineractWalletId < 1) {
      return jsonErrors(
        [{ code: "ValidationError", message: "Invalid wallet id", field: "id" }],
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

    const { amount, transactionDate, reference, description, channel } = result.data;
    const finRes = await withdrawFromWallet(fineractWalletId, {
      amount,
      transactionDate,
      reference,
      description,
      channel,
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
      withdrawn: true,
      fineractWalletId,
      resourceId: finRes.resourceId,
    }, { meta: metaWithImplementationConfidence() });
  } catch (err) {
    if (err instanceof FineractNotConfigured) {
      return jsonErrors(
        [
          {
            code: "ServiceUnavailable",
            message: "Fineract is not configured. Set FINERACT_BASE_URL to enable wallet withdraw.",
          },
        ],
        503,
        { route: ROUTE }
      );
    }
    const message = err instanceof Error ? err.message : "Withdraw failed";
    logger.error(ROUTE, message, { error: err });
    return jsonErrors(
      [{ code: "InternalError", message: "Unable to process withdrawal. Please try again." }],
      500,
      { route: ROUTE }
    );
  }
}
