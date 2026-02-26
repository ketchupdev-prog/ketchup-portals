/**
 * Environment variable validation (fail-fast at runtime).
 * Validates required and optional env vars using Zod. Use from server code only.
 * Location: src/lib/env.ts
 * Principle: Ship Stable Code (Rule 15) – catch configuration issues early.
 */

import { z } from "zod";

/** Exported for unit tests (validate required/optional env without process.env). */
export const serverEnvSchema = z.object({
  /** Required for DB (Neon). Set in .env.local or Vercel. */
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  /** Optional: Buffr app API – Ketchup issues vouchers to beneficiaries via Buffr; used for sync/reconciliation */
  BUFFR_API_URL: z.string().url().optional().or(z.literal("")),
  BUFFR_API_KEY: z.string().optional(),
  /** Optional: when "true", middleware redirects unauthenticated users to /login */
  NEXT_PUBLIC_REQUIRE_AUTH: z.string().optional().default(""),
  /** Optional: secret for cron (e.g. POST /api/v1/sms/process). Fallback: SMS_CRON_SECRET */
  CRON_SECRET: z.string().optional(),
  SMS_CRON_SECRET: z.string().optional(),
  /** Optional: webhook signature verification for SMS delivery/inbound */
  SMS_WEBHOOK_SECRET: z.string().optional(),
  /** Optional: SMS gateway API (used by lib/services/sms.ts) */
  SMS_API_URL: z.string().url().optional().or(z.literal("")),
  SMS_API_KEY: z.string().optional(),
  /** Optional: base URL for cron callbacks (e.g. local dev) */
  BASE_URL: z.string().url().optional().or(z.literal("")),
  /** Optional: SMTP for transactional email (password reset, onboarding). PRD §7.4.1 */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional().or(z.literal("")),
  SMTP_SECURE: z.string().optional(),
  /** Optional: Neon Auth – server-side auth API base URL (from Neon Console → Auth). */
  NEON_AUTH_BASE_URL: z.string().url().optional().or(z.literal("")),
  /** Optional: Neon Auth – cookie signing secret (min 32 chars when set; e.g. openssl rand -base64 32). */
  NEON_AUTH_COOKIE_SECRET: z.string().optional(),
  /** Optional: Neon Auth – client-side auth URL (same as NEON_AUTH_BASE_URL; NEXT_PUBLIC_ for client). */
  NEXT_PUBLIC_NEON_AUTH_URL: z.string().url().optional().or(z.literal("")),
  /** Optional: Float amount (NAD) above which two approvals are required. Default 50000. PRD Audit §1.6. */
  DUAL_CONTROL_FLOAT_THRESHOLD_NAD: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _cached: ServerEnv | null = null;

/**
 * Returns validated server env. Throws on first call if required vars are missing.
 * Call from server-only code (e.g. db init, API routes).
 */
export function getServerEnv(): ServerEnv {
  if (_cached) return _cached;
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BUFFR_API_URL: process.env.BUFFR_API_URL,
    BUFFR_API_KEY: process.env.BUFFR_API_KEY,
    NEXT_PUBLIC_REQUIRE_AUTH: process.env.NEXT_PUBLIC_REQUIRE_AUTH,
    CRON_SECRET: process.env.CRON_SECRET,
    SMS_CRON_SECRET: process.env.SMS_CRON_SECRET,
    SMS_WEBHOOK_SECRET: process.env.SMS_WEBHOOK_SECRET,
    SMS_API_URL: process.env.SMS_API_URL,
    SMS_API_KEY: process.env.SMS_API_KEY,
    BASE_URL: process.env.BASE_URL,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_SECURE: process.env.SMTP_SECURE,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
    NEXT_PUBLIC_NEON_AUTH_URL: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
    DUAL_CONTROL_FLOAT_THRESHOLD_NAD: process.env.DUAL_CONTROL_FLOAT_THRESHOLD_NAD,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const msg = first ? `${first.path.join(".")}: ${first.message}` : "Invalid environment configuration";
    throw new Error(`Env validation failed: ${msg}`);
  }
  _cached = parsed.data;
  return _cached;
}

/**
 * Call once from server code paths that need DB. Ensures env is valid before using DATABASE_URL.
 */
export function assertServerEnv(): void {
  getServerEnv();
}
