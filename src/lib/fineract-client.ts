/**
 * Fineract API client for flow orchestration (voucher redeem, wallet withdraw/deposit).
 * Location: src/lib/fineract-client.ts
 * Purpose: Call Fineract after Token Vault or bank success for ledger updates. PRD §14.3, §17; FINERACT_PRD_ALIGNMENT.md §6.
 * When FINERACT_BASE_URL is not set, throws FineractNotConfigured (callers return 503).
 */

import { logger } from "@/lib/logger";

const ROUTE = "fineract-client";

const FINERACT_BASE_URL = process.env.FINERACT_BASE_URL;
const FINERACT_USERNAME = process.env.FINERACT_USERNAME ?? "mifos";
const FINERACT_PASSWORD = process.env.FINERACT_PASSWORD ?? "password";
const FINERACT_TENANT_ID = process.env.FINERACT_TENANT_ID ?? "default";
const FINERACT_TIMEOUT_MS = Math.max(5000, parseInt(process.env.FINERACT_TIMEOUT ?? "15000", 10));

export class FineractNotConfigured extends Error {
  constructor() {
    super("Fineract is not configured. Set FINERACT_BASE_URL to enable ledger updates.");
    this.name = "FineractNotConfigured";
  }
}

function getAuthHeader(): string {
  const encoded = Buffer.from(`${FINERACT_USERNAME}:${FINERACT_PASSWORD}`).toString("base64");
  return `Basic ${encoded}`;
}

async function fineractFetch<T>(
  path: string,
  method: "GET" | "PUT" | "POST",
  body?: object
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  if (!FINERACT_BASE_URL?.trim()) {
    throw new FineractNotConfigured();
  }
  const base = FINERACT_BASE_URL.replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FINERACT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
        "Fineract-Platform-TenantId": FINERACT_TENANT_ID,
      },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await res.text();
    let data: T | undefined;
    let error: string | undefined;
    try {
      if (text) data = JSON.parse(text) as T;
    } catch {
      error = text || res.statusText;
    }
    if (!res.ok) {
      error = error ?? (data as { message?: string })?.message ?? res.statusText;
      logger.warn(ROUTE, "Fineract request failed", { path, status: res.status, error });
    }
    return { ok: res.ok, status: res.status, data, error };
  } catch (e) {
    clearTimeout(timeout);
    if ((e as Error).name === "AbortError") {
      logger.error(ROUTE, "Fineract request timeout", { path });
      return { ok: false, status: 504, error: "Fineract request timeout" };
    }
    throw e;
  }
}

/** Redemption method: 1=QR/wallet, 2=Bank transfer, 3=Merchant payment, 4=Cash out (Fineract custom module). */
export type RedemptionMethod = 1 | 2 | 3 | 4;

export interface RedeemVoucherBody {
  redemptionMethod: RedemptionMethod;
  redemptionDate?: string; // YYYY-MM-DD
  description?: string;
  transactionId?: string;
  trustAccountDebited?: boolean;
  bankAccountEncrypted?: string;
  merchantId?: string;
}

/**
 * Redeem a voucher in Fineract. Uses PUT /v1/vouchers/{voucherId}?command=redeem.
 * Call after Token Vault validate success (or after bank/PIS success for bank_transfer).
 */
export async function redeemVoucher(
  fineractVoucherId: number,
  body: RedeemVoucherBody
): Promise<{ ok: boolean; status: number; resourceId?: number; error?: string }> {
  const redemptionDate = body.redemptionDate ?? new Date().toISOString().slice(0, 10);
  const payload = {
    redemptionMethod: body.redemptionMethod,
    redemptionDate,
    ...(body.description != null && { description: body.description }),
    ...(body.transactionId != null && { transactionId: body.transactionId }),
    ...(body.trustAccountDebited != null && { trustAccountDebited: body.trustAccountDebited }),
    ...(body.bankAccountEncrypted != null && { bankAccountEncrypted: body.bankAccountEncrypted }),
    ...(body.merchantId != null && { merchantId: body.merchantId }),
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  };
  const res = await fineractFetch<{ resourceId?: number }>(
    `/vouchers/${fineractVoucherId}?command=redeem`,
    "PUT",
    payload
  );
  return {
    ok: res.ok,
    status: res.status,
    resourceId: res.data?.resourceId,
    error: res.error,
  };
}

export interface WalletWithdrawBody {
  amount: string; // decimal string
  transactionDate?: string; // YYYY-MM-DD
  reference?: string;
  description?: string;
  channel?: string;
}

/**
 * Withdraw from wallet in Fineract. Uses PUT /v1/wallets/{walletId}?command=withdraw.
 * Call after bank PIS success (pacs.002 ACCP) or after till/agent/merchant/ATM confirmation.
 */
export async function withdrawFromWallet(
  fineractWalletId: number,
  body: WalletWithdrawBody
): Promise<{ ok: boolean; status: number; resourceId?: number; error?: string }> {
  const transactionDate = body.transactionDate ?? new Date().toISOString().slice(0, 10);
  const payload = {
    amount: body.amount,
    transactionDate,
    ...(body.reference != null && { reference: body.reference }),
    ...(body.description != null && { description: body.description }),
    ...(body.channel != null && { channel: body.channel }),
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  };
  const res = await fineractFetch<{ resourceId?: number }>(
    `/wallets/${fineractWalletId}?command=withdraw`,
    "PUT",
    payload
  );
  return {
    ok: res.ok,
    status: res.status,
    resourceId: res.data?.resourceId,
    error: res.error,
  };
}

export interface WalletDepositBody {
  amount: string;
  transactionDate?: string;
  reference?: string;
  description?: string;
  channel?: string;
}

/**
 * Deposit to wallet in Fineract. Uses PUT /v1/wallets/{walletId}?command=deposit.
 * Call after voucher redeem-to-wallet to credit the wallet.
 */
export async function depositToWallet(
  fineractWalletId: number,
  body: WalletDepositBody
): Promise<{ ok: boolean; status: number; resourceId?: number; error?: string }> {
  const transactionDate = body.transactionDate ?? new Date().toISOString().slice(0, 10);
  const payload = {
    amount: body.amount,
    transactionDate,
    ...(body.reference != null && { reference: body.reference }),
    ...(body.description != null && { description: body.description }),
    ...(body.channel != null && { channel: body.channel }),
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  };
  const res = await fineractFetch<{ resourceId?: number }>(
    `/wallets/${fineractWalletId}?command=deposit`,
    "PUT",
    payload
  );
  return {
    ok: res.ok,
    status: res.status,
    resourceId: res.data?.resourceId,
    error: res.error,
  };
}

/** Returns true if Fineract is configured (FINERACT_BASE_URL set). */
export function isFineractConfigured(): boolean {
  return Boolean(FINERACT_BASE_URL?.trim());
}
