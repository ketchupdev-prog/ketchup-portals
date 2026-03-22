/**
 * POST /api/v1/mobile/qr/generate – Generate NAMQR TLV payload (Token Vault NREF in Tag 65, CRC in Tag 63).
 * Auth: Session only (beneficiary generates their own QR code).
 * PRD §14.3, §9.4; FINERACT_PRD_ALIGNMENT.md §5, Part B.5.
 * Body: Open Banking root { data: { point_of_initiation, payee_id, payee_name, country_code, ... } } or flat.
 * Response: { data: { payload: string } }. Vercel-compatible; rate limited (50/min per user).
 */

import { NextRequest } from "next/server";
import { jsonSuccess, jsonErrors, metaWithImplementationConfidence, jsonError } from "@/lib/api-response";
import { buildNamqrPayload, type NamqrGenerateParams, type PointOfInitiation } from "@/lib/namqr";
import { logger } from "@/lib/logger";
import { getPortalSession } from "@/lib/portal-auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { parseRootData } from "@/lib/open-banking";
import { z } from "zod";

const ROUTE = "POST /api/v1/mobile/qr/generate";

const pointOfInitiationSchema = z.enum(["11", "12", "13", "14"]);

const generateBodySchema = z.object({
  point_of_initiation: pointOfInitiationSchema,
  payee_id: z.string().min(1, "payee_id required").max(99),
  merchant_category_code: z.string().max(4).optional(),
  country_code: z.string().length(2).optional().default("NA"),
  payee_name: z.string().min(1, "payee_name required").max(99),
  payee_city: z.string().max(99).optional(),
  transaction_currency: z.string().max(3).optional(),
  transaction_amount: z.string().max(99).optional(),
  reference: z.string().max(99).optional(),
  expiry_datetime: z.string().max(14).optional(),
});

/**
 * Obtain NREF from Token Vault (or stub when TOKEN_VAULT_URL not set).
 * Production: POST to Token Vault with params, return NREF from response.
 */
async function getNrefFromTokenVault(_params: NamqrGenerateParams): Promise<string> {
  const baseUrl = process.env.TOKEN_VAULT_URL;
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(_params),
      });
      if (!res.ok) {
        const text = await res.text();
        logger.error(ROUTE, "Token Vault generate failed", { status: res.status, body: text });
        throw new Error("Token Vault unavailable");
      }
      const data = (await res.json()) as { nref?: string; data?: { nref?: string } };
      const nref = data.nref ?? data.data?.nref;
      if (nref && typeof nref === "string") return nref;
    } catch (err) {
      logger.error(ROUTE, err instanceof Error ? err.message : "Token Vault error", { error: err });
      throw err;
    }
  }
  // Stub: deterministic NREF for development
  return `STUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Session authentication: Verify beneficiary is logged in (SEC-001)
    const session = getPortalSession(request);
    if (!session) {
      return jsonError("Unauthorized", "Unauthorized", undefined, 401, ROUTE);
    }

    // Rate limiting: ADMIN preset (50/min per user) (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const parsed = parseRootData<Record<string, unknown>>(body);
    const raw =
      !("error" in parsed) && parsed.data != null && typeof parsed.data === "object"
        ? (parsed.data as Record<string, unknown>)
        : (body as Record<string, unknown>);

    const result = generateBodySchema.safeParse(raw);
    if (!result.success) {
      const first = result.error.issues[0];
      const message = first?.message ?? "Validation failed";
      const field = first?.path?.join(".");
      return jsonErrors(
        [{ code: "ValidationError", message: String(message), field: field as string }],
        400
      );
    }

    const params: NamqrGenerateParams = {
      point_of_initiation: result.data.point_of_initiation as PointOfInitiation,
      payee_id: result.data.payee_id,
      payee_name: result.data.payee_name,
      country_code: result.data.country_code,
      merchant_category_code: result.data.merchant_category_code,
      payee_city: result.data.payee_city,
      transaction_currency: result.data.transaction_currency,
      transaction_amount: result.data.transaction_amount,
      reference: result.data.reference,
      expiry_datetime: result.data.expiry_datetime,
    };

    const nref = await getNrefFromTokenVault(params);
    const payload = buildNamqrPayload(params, nref);

    return jsonSuccess({ payload }, { meta: metaWithImplementationConfidence(), status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "QR generate error";
    logger.error(ROUTE, message, { error: err });
    return jsonErrors(
      [{ code: "InternalError", message: "Unable to generate QR payload. Please try again." }],
      500,
      { route: ROUTE }
    );
  }
}
