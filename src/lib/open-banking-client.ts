/**
 * Open Banking Data Provider client – no mocks.
 * Namibian Open Banking Standards v1.0 (§17.1): mTLS (QWAC), headers (Authorization, x-v, ParticipantId, x-fapi-interaction-id), responses data/links/meta.
 * When env is not configured, callers receive OpenBankingNotConfigured; return 503 from routes.
 * Location: ketchup-portals/src/lib/open-banking-client.ts
 */

import https from "https";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const ROUTE = "open-banking-client";

export class OpenBankingNotConfigured extends Error {
  constructor(message: string = "Open Banking is not configured. Set OPEN_BANKING_TPP_ID and Data Provider endpoints or OPEN_BANKING_DIRECTORY_URL.") {
    super(message);
    this.name = "OpenBankingNotConfigured";
  }
}

/** Per PRD §17.1 and §11.8.13 */
export type OpenBankingResponse<T> = {
  data: T;
  links?: { self?: string; [k: string]: string | undefined };
  meta?: { totalRecords?: number; [k: string]: unknown };
};

export type OpenBankingErrorItem = { code: string; title: string; detail?: string };
export type OpenBankingErrorResponse = { errors: OpenBankingErrorItem[] };

export type BankItem = {
  id: string;
  name: string;
  logoUrl?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  parEndpoint?: string;
};

export type ConsentResult = {
  authorizationUrl?: string;
  requestUri?: string;
  state: string;
};

export type TokenExchangeResult = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
};

function getTppId(): string | null {
  return process.env.OPEN_BANKING_TPP_ID?.trim() || null;
}

function getMtlsAgent(): https.Agent | undefined {
  const cert = process.env.OPEN_BANKING_MTLS_CERT;
  const key = process.env.OPEN_BANKING_MTLS_KEY;
  if (!cert || !key) return undefined;
  try {
    return new https.Agent({
      cert,
      key,
      ca: process.env.OPEN_BANKING_MTLS_CA || undefined,
      rejectUnauthorized: true,
    });
  } catch (e) {
    logger.error(ROUTE, "mTLS agent creation failed", { error: e });
    return undefined;
  }
}

/** Fetch with optional mTLS (Node https agent). When agent is set, use https.request; otherwise global fetch. */
function fetchWithMtls(
  url: string,
  init: RequestInit & { agent?: https.Agent }
): Promise<Response> {
  const { agent, ...rest } = init;
  if (!agent) return fetch(url, rest);
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = (rest.headers as Record<string, string>) || {};
    const body = typeof rest.body === "string" ? rest.body : rest.body == null ? undefined : String(rest.body);
    if (body) headers["Content-Length"] = Buffer.byteLength(body, "utf8").toString();
    const options: https.RequestOptions = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: (rest.method as string) || "GET",
      headers,
      agent,
    };
    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(
          new Response(text, {
            status: res.statusCode ?? 500,
            statusText: res.statusMessage ?? "",
            headers: new Headers(res.headers as Record<string, string>),
          })
        );
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

/** Headers required for every request to Data Provider (§17.1) */
function openBankingHeaders(accessToken: string | null): Record<string, string> {
  const tppId = getTppId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-v": "1",
    "x-fapi-interaction-id": crypto.randomUUID(),
  };
  if (tppId) headers["ParticipantId"] = tppId;
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return headers;
}

function isOpenBankingConfigured(): boolean {
  const directory = process.env.OPEN_BANKING_DIRECTORY_URL?.trim();
  const banksJson = process.env.OPEN_BANKING_BANKS_JSON?.trim();
  return Boolean(getTppId() && (directory || banksJson));
}

/** Parse response as data/links/meta or errors */
async function parseObResponse<T>(res: Response, logLabel: string): Promise<OpenBankingResponse<T>> {
  const json = await res.json().catch(() => ({})) as OpenBankingResponse<T> | OpenBankingErrorResponse;
  if ("errors" in json && Array.isArray((json as OpenBankingErrorResponse).errors)) {
    const err = (json as OpenBankingErrorResponse).errors[0];
    logger.error(ROUTE, `${logLabel} Data Provider error`, { code: err?.code, detail: err?.detail });
    throw new Error(err?.detail ?? err?.title ?? "Data Provider error");
  }
  return json as OpenBankingResponse<T>;
}

/**
 * GET list of banks from Open Banking directory or from env OPEN_BANKING_BANKS_JSON.
 * No mocks: if not configured, throws OpenBankingNotConfigured.
 */
export async function getBanksFromProvider(): Promise<BankItem[]> {
  if (!isOpenBankingConfigured()) throw new OpenBankingNotConfigured();

  const banksJson = process.env.OPEN_BANKING_BANKS_JSON?.trim();
  if (banksJson) {
    try {
      const arr = JSON.parse(banksJson) as BankItem[];
      return Array.isArray(arr) ? arr.map((b) => ({ ...b, logoUrl: b.logoUrl ?? undefined })) : [];
    } catch (e) {
      logger.error(ROUTE, "OPEN_BANKING_BANKS_JSON parse error", { error: e });
      throw new OpenBankingNotConfigured("OPEN_BANKING_BANKS_JSON is invalid.");
    }
  }

  const directoryUrl = process.env.OPEN_BANKING_DIRECTORY_URL?.replace(/\/$/, "");
  if (!directoryUrl) throw new OpenBankingNotConfigured();

  const agent = getMtlsAgent();
  const url = `${directoryUrl}/banks`;
  const res = await fetchWithMtls(url, {
    method: "GET",
    headers: openBankingHeaders(null),
    agent: agent ?? undefined,
  });

  if (!res.ok) throw new Error(`Directory request failed: ${res.status}`);
  const parsed = await parseObResponse<BankItem[]>(res, "getBanks");
  return parsed.data ?? [];
}

/**
 * Create consent request: call Data Provider PAR endpoint or build authorization URL.
 * No mocks: requires bank config (from getBanks or OPEN_BANKING_BANKS_JSON) and returns real authorizationUrl/requestUri.
 */
export async function createConsentWithProvider(params: {
  bankId: string;
  scopes: string[];
  redirectUri: string;
  state: string;
  codeVerifier?: string;
}): Promise<ConsentResult> {
  if (!getTppId()) throw new OpenBankingNotConfigured();

  const banks = await getBanksFromProvider();
  const bank = banks.find((b) => b.id === params.bankId);
  if (!bank) throw new Error("Bank not found");

  const parEndpoint = bank.parEndpoint ?? process.env[`OPEN_BANKING_${params.bankId.toUpperCase().replace(/-/g, "_")}_PAR_ENDPOINT`];
  const authEndpoint = bank.authorizationEndpoint ?? process.env[`OPEN_BANKING_${params.bankId.toUpperCase().replace(/-/g, "_")}_AUTH_ENDPOINT`];

  if (parEndpoint) {
    const agent = getMtlsAgent();
    const body = {
      redirect_uri: params.redirectUri,
      state: params.state,
      scope: params.scopes.join(" "),
      response_type: "code",
      code_challenge_method: "S256",
      code_challenge: params.codeVerifier ? await sha256Base64Url(params.codeVerifier) : undefined,
    };
    const res = await fetchWithMtls(parEndpoint, {
      method: "POST",
      headers: openBankingHeaders(null),
      body: JSON.stringify(body),
      agent: agent ?? undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as OpenBankingErrorResponse;
      const detail = err.errors?.[0]?.detail ?? res.statusText;
      throw new Error(detail);
    }
    const data = (await res.json()) as { request_uri?: string; expires_in?: number };
    const requestUri = data.request_uri;
    const baseAuth = authEndpoint || parEndpoint.replace(/\/par$/, "/authorize");
    return {
      requestUri: requestUri ?? undefined,
      authorizationUrl: requestUri ? `${baseAuth}?request_uri=${encodeURIComponent(requestUri)}` : baseAuth,
      state: params.state,
    };
  }

  if (authEndpoint) {
    const paramsUrl = new URLSearchParams({
      response_type: "code",
      client_id: process.env.OPEN_BANKING_CLIENT_ID || getTppId()!,
      redirect_uri: params.redirectUri,
      state: params.state,
      scope: params.scopes.join(" "),
    });
    if (params.codeVerifier) {
      paramsUrl.set("code_challenge_method", "S256");
      paramsUrl.set("code_challenge", await sha256Base64Url(params.codeVerifier));
    }
    return { authorizationUrl: `${authEndpoint}?${paramsUrl.toString()}`, state: params.state };
  }

  throw new OpenBankingNotConfigured("Bank has no PAR or authorization endpoint configured.");
}

async function sha256Base64Url(input: string): Promise<string> {
  return crypto.createHash("sha256").update(input, "utf8").digest("base64url");
}

/**
 * Exchange authorization code for access token at Data Provider token endpoint.
 * No mocks: real token exchange with mTLS and Open Banking headers.
 */
export async function exchangeCodeWithProvider(params: {
  bankId: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}): Promise<TokenExchangeResult> {
  if (!getTppId()) throw new OpenBankingNotConfigured();

  const banks = await getBanksFromProvider();
  const bank = banks.find((b) => b.id === params.bankId);
  if (!bank?.tokenEndpoint) throw new Error("Bank or token endpoint not found");

  const clientId = process.env.OPEN_BANKING_CLIENT_ID || getTppId();
  const clientSecret = process.env.OPEN_BANKING_CLIENT_SECRET;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: clientId!,
  });
  if (params.codeVerifier) body.set("code_verifier", params.codeVerifier);
  if (clientSecret) body.set("client_secret", clientSecret);

  const agent = getMtlsAgent();
  const res = await fetchWithMtls(bank.tokenEndpoint, {
    method: "POST",
    headers: {
      ...openBankingHeaders(null),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    agent: agent ?? undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as OpenBankingErrorResponse;
    const detail = (err.errors?.[0]?.detail) ?? ((await res.text()) || res.statusText);
    throw new Error(detail);
  }

  const data = (await res.json()) as TokenExchangeResult;
  return {
    access_token: data.access_token,
    token_type: data.token_type ?? "Bearer",
    expires_in: data.expires_in ?? 3600,
    refresh_token: data.refresh_token,
  };
}

export { isOpenBankingConfigured };
