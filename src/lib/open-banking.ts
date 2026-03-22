/**
 * Open Banking & ISO 20022–aligned API helpers.
 * Ref: g2p/docs/NAMIBIAN_OPEN_BANKING_STANDARDS_V1.txt (root object, headers, Payment Initiation).
 * Location: src/lib/open-banking.ts
 */

import type { NextRequest } from "next/server";

/** API version header (x-v): positive integer per Open Banking. */
export const DEFAULT_API_VERSION = 1;

/**
 * ISO 20022–style payment initiation payload (aligned with pain.002 / PaymentInformation).
 * Use for POST payment/voucher/transfer endpoints.
 */
export type PaymentInitiationPayload = {
  /** Instruction identification (idempotency key). */
  instructionId: string;
  /** Debtor (payer) account or party identifier. */
  debtor?: { name?: string; accountId?: string; partyId?: string };
  /** Creditor (payee) account or party identifier. */
  creditor: { name?: string; accountId?: string; partyId?: string };
  /** Amount in minor units (e.g. cents). */
  amount: number;
  /** ISO 4217 currency (e.g. NAD, USD). */
  currency: string;
  /** End-to-end reference for the payment. */
  endToEndId?: string;
  /** Remittance information (unstructured). */
  remittanceInformation?: string;
  /** Requested execution date (ISO 8601). */
  requestedExecutionDate?: string;
};

/**
 * Parse Open Banking root request body: { data: T, meta?: object }.
 * Returns parsed data or null if invalid.
 */
export function parseRootData<T>(body: unknown): { data: T } | { error: string } {
  if (body == null || typeof body !== "object" || !("data" in body)) {
    return { error: "Request must have a root object with 'data'" };
  }
  const root = body as { data: unknown; meta?: unknown };
  return { data: root.data as T };
}

/**
 * Get x-v (API version) from request. Open Banking: mandatory positive integer.
 * Returns default if missing or invalid.
 */
export function getApiVersion(request: NextRequest): number {
  const v = request.headers.get("x-v");
  if (v == null) return DEFAULT_API_VERSION;
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n >= 1 ? n : DEFAULT_API_VERSION;
}

/**
 * Get Idempotency-Key from request. Recommended for POST payment/initiation.
 * Returns null if not present.
 */
export function getIdempotencyKey(request: NextRequest): string | null {
  const key = request.headers.get("idempotency-key") ?? request.headers.get("Idempotency-Key");
  return key?.trim() || null;
}

/**
 * Validate Content-Type is application/json for POST/PUT.
 */
export function requireJsonContentType(request: NextRequest): boolean {
  const ct = request.headers.get("content-type") ?? "";
  return ct.split(";")[0].trim().toLowerCase() === "application/json";
}

/**
 * Build PaymentInitiationPayload from a flat body (e.g. beneficiary_id, amount, currency).
 * Use when front-end sends simple payload; map to ISO 20022–style for storage/audit.
 */
export function mapToPaymentInitiation(params: {
  instructionId: string;
  amount: number;
  currency: string;
  creditorId?: string;
  creditorName?: string;
  debtorId?: string;
  remittanceInformation?: string;
  requestedExecutionDate?: string;
}): PaymentInitiationPayload {
  return {
    instructionId: params.instructionId,
    amount: params.amount,
    currency: params.currency,
    endToEndId: params.instructionId,
    creditor: {
      partyId: params.creditorId,
      name: params.creditorName,
    },
    debtor: params.debtorId ? { partyId: params.debtorId } : undefined,
    remittanceInformation: params.remittanceInformation,
    requestedExecutionDate: params.requestedExecutionDate,
  };
}
