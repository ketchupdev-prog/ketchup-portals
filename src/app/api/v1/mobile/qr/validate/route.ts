/**
 * POST /api/v1/mobile/qr/validate – Validate scanned NAMQR via Token Vault; return payee/amount etc.
 * Auth: Session only (beneficiary validates QR before payment).
 * PRD §14.3, §9.4; FINERACT_PRD_ALIGNMENT.md §5, Part B.5.
 * Body: { data: { payload: string } } or { payload: string }. Response: { data: { valid, payee_name?, ... } }.
 * CRC is validated server-side; Token Vault called when TOKEN_VAULT_URL is set.
 * Rate limited (200/min per IP).
 */

import { NextRequest } from "next/server";
import { jsonSuccess, jsonErrors, metaWithImplementationConfidence, jsonError } from "@/lib/api-response";
import {
  parseTlv,
  validateCrc,
  isNamqrPayload,
  getNrefFromPayload,
  type NamqrValidateResult,
} from "@/lib/namqr";
import { logger } from "@/lib/logger";
import { getPortalSession } from "@/lib/portal-auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { parseRootData } from "@/lib/open-banking";
import { z } from "zod";

const ROUTE = "POST /api/v1/mobile/qr/validate";

const validateBodySchema = z.object({
  payload: z.string().min(1, "payload required").max(600),
});

/**
 * Call Token Vault validate endpoint. Returns validation result or throws.
 */
async function validateWithTokenVault(
  payload: string,
  nref: string
): Promise<{ valid: boolean; payee_name?: string; payee_id?: string; transaction_amount?: string; transaction_currency?: string; reference?: string }> {
  const baseUrl = process.env.TOKEN_VAULT_URL;
  if (baseUrl) {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, nref }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error(ROUTE, "Token Vault validate failed", { status: res.status, body: text });
      return { valid: false };
    }
    const data = (await res.json()) as { valid?: boolean; data?: NamqrValidateResult };
    const d = (data.data ?? data) as NamqrValidateResult;
    return {
      valid: Boolean(d.valid),
      payee_name: d.payee_name,
      payee_id: d.payee_id,
      transaction_amount: d.transaction_amount,
      transaction_currency: d.transaction_currency,
      reference: d.reference,
    };
  }
  // Stub: parse TLV and return extracted fields as valid
  const tags = parseTlv(payload);
  return {
    valid: true,
    payee_name: tags["59"],
    payee_id: tags["26"] ?? tags["29"],
    transaction_amount: tags["54"],
    transaction_currency: tags["53"],
    reference: tags["62"],
  };
}

export async function POST(request: NextRequest) {
  try {
    // Session authentication: Verify beneficiary is logged in (SEC-001)
    const session = getPortalSession(request);
    if (!session) {
      return jsonError("Unauthorized", "Unauthorized", undefined, 401, ROUTE);
    }

    // Rate limiting: READ_ONLY preset (200/min per IP) (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.READ_ONLY);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const parsed = parseRootData<Record<string, unknown>>(body);
    const raw =
      !("error" in parsed) && parsed.data != null && typeof parsed.data === "object"
        ? (parsed.data as Record<string, unknown>)
        : (body as Record<string, unknown>);

    const result = validateBodySchema.safeParse(raw);
    if (!result.success) {
      const first = result.error.issues[0];
      return jsonErrors(
        [
          {
            code: "ValidationError",
            message: first?.message ?? "Validation failed",
            field: "payload",
          },
        ],
        400
      );
    }

    const payload = result.data.payload;

    if (!isNamqrPayload(payload)) {
      return jsonSuccess({
        valid: false,
        errors: ["Invalid NAMQR: payload format indicator (Tag 00) or Tag 63 missing/incorrect."],
      } satisfies NamqrValidateResult);
    }

    if (!validateCrc(payload)) {
      return jsonSuccess({
        valid: false,
        errors: ["CRC (Tag 63) mismatch. QR may be corrupted or altered."],
      } satisfies NamqrValidateResult);
    }

    const nref = getNrefFromPayload(payload);
    if (!nref) {
      return jsonSuccess({
        valid: false,
        errors: ["Token Vault identifier (Tag 65) missing."],
      } satisfies NamqrValidateResult);
    }

    const tvResult = await validateWithTokenVault(payload, nref);
    const response: NamqrValidateResult = {
      valid: tvResult.valid,
      payee_name: tvResult.payee_name,
      payee_id: tvResult.payee_id,
      transaction_amount: tvResult.transaction_amount,
      transaction_currency: tvResult.transaction_currency,
      reference: tvResult.reference,
      nref,
    };

    return jsonSuccess(response, { meta: metaWithImplementationConfidence(), status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "QR validate error";
    logger.error(ROUTE, message, { error: err });
    return jsonErrors(
      [{ code: "InternalError", message: "Unable to validate QR. Please try again." }],
      500,
      { route: ROUTE }
    );
  }
}
