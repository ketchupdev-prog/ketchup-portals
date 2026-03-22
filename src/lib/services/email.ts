/**
 * Email service – Send transactional email via SMTP (PRD §7.4.1).
 * Used for password reset, portal user onboarding, report delivery.
 * When SMTP env vars are missing, sendEmail no-ops and returns { sent: false }.
 * Location: src/lib/services/email.ts
 */

import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";
import { buildPortalUrl } from "@/lib/portal-url";
import { getPortalForgotPasswordPath } from "@/lib/portal-auth-config";
import { CONTACT_EMAIL } from "@/lib/contact";
import type { PortalSlug } from "@/lib/portal-auth-config";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

function getTransport(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? CONTACT_EMAIL;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

/**
 * Send one email. Returns { sent: true, messageId } on success, { sent: false, error } when
 * SMTP not configured or on failure. Does not throw.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transport = getTransport();
  if (!transport) {
    return { sent: false, error: "SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)" };
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? CONTACT_EMAIL;

  try {
    const info = await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text ?? undefined,
      html: options.html ?? options.text ?? undefined,
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Email send error:", message);
    return { sent: false, error: message };
  }
}

/**
 * Build the password reset link for a portal (uses NEXT_PUBLIC_PORTAL_URL or BASE_URL).
 * Call from server only (e.g. forgot-password route when sending reset email).
 */
export function buildPasswordResetLink(portal: PortalSlug, token: string): string {
  const path = `${getPortalForgotPasswordPath(portal)}?token=${encodeURIComponent(token)}`;
  return buildPortalUrl(path, getServerEnv());
}

/**
 * Send password reset email. Uses buildPasswordResetLink for the portal URL.
 * Returns sendEmail result. Call from server only.
 */
export async function sendPasswordResetEmail(
  to: string,
  portal: PortalSlug,
  token: string,
  options?: { subject?: string }
): Promise<SendEmailResult> {
  const link = buildPasswordResetLink(portal, token);
  const subject = options?.subject ?? "Reset your password – Ketchup Portals";
  const text = `Use this link to reset your password: ${link}\n\nIf you didn't request this, ignore this email.`;
  const html = `<!DOCTYPE html><html><body><p>Use this link to reset your password:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email.</p></body></html>`;
  return sendEmail({ to, subject, text, html });
}
