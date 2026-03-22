/**
 * Buffr integration persistence helpers.
 *
 * Purpose: durable state/token storage for OAuth callback completion and
 * webhook idempotency in serverless deployments.
 *
 * Location: src/lib/integrations/buffr/persistence.ts
 */

import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

type OAuthStateRecord = {
  state: string;
  bankId: string;
  redirectUri: string;
  codeVerifier: string | null;
};

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for Buffr persistence");
  return neon(databaseUrl);
}

let schemaEnsured = false;

async function ensureSchema(): Promise<void> {
  if (schemaEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS buffr_oauth_states (
      state TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      code_verifier TEXT,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS buffr_link_tokens (
      user_id TEXT NOT NULL,
      state TEXT NOT NULL,
      bank_id TEXT NOT NULL,
      token_type TEXT NOT NULL,
      expires_in INTEGER NOT NULL,
      access_token_hash TEXT NOT NULL,
      refresh_token_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, state)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS buffr_webhook_events (
      event_key TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  schemaEnsured = true;
}

export async function saveOAuthState(record: OAuthStateRecord): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO buffr_oauth_states (state, bank_id, redirect_uri, code_verifier)
    VALUES (${record.state}, ${record.bankId}, ${record.redirectUri}, ${record.codeVerifier})
    ON CONFLICT (state) DO UPDATE
      SET bank_id = EXCLUDED.bank_id,
          redirect_uri = EXCLUDED.redirect_uri,
          code_verifier = EXCLUDED.code_verifier,
          consumed_at = NULL
  `;
}

export async function consumeOAuthState(state: string): Promise<OAuthStateRecord | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    UPDATE buffr_oauth_states
       SET consumed_at = NOW()
     WHERE state = ${state}
       AND consumed_at IS NULL
    RETURNING state, bank_id AS "bankId", redirect_uri AS "redirectUri", code_verifier AS "codeVerifier"
  `) as OAuthStateRecord[];
  return rows[0] ?? null;
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function persistLinkedToken(params: {
  userId: string;
  state: string;
  bankId: string;
  tokenType: string;
  expiresIn: number;
  accessToken: string;
  refreshToken?: string;
}): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO buffr_link_tokens (
      user_id, state, bank_id, token_type, expires_in, access_token_hash, refresh_token_hash
    ) VALUES (
      ${params.userId},
      ${params.state},
      ${params.bankId},
      ${params.tokenType},
      ${params.expiresIn},
      ${tokenHash(params.accessToken)},
      ${params.refreshToken ? tokenHash(params.refreshToken) : null}
    )
  `;
}

export async function markWebhookReceived(params: {
  eventKey: string;
  eventType: string;
  payload: unknown;
}): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  const insertResult = (await sql`
    INSERT INTO buffr_webhook_events (event_key, event_type, payload)
    VALUES (${params.eventKey}, ${params.eventType}, ${JSON.stringify(params.payload ?? {})}::jsonb)
    ON CONFLICT (event_key) DO NOTHING
    RETURNING TRUE AS inserted
  `) as Array<{ inserted: boolean }>;
  return insertResult.length > 0 && insertResult[0]?.inserted === true;
}
