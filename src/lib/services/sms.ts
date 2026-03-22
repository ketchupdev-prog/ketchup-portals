/**
 * SMS Service – Abstracts the SMS gateway (InfoBip, Twilio, etc.).
 * Location: src/lib/services/sms.ts
 * Uses SMS_API_URL and SMS_API_KEY; provider can be swapped without changing callers.
 * Implements SEC-008: All SMS messages include authentication markers.
 */

import { formatSMSWithAuthMarkers } from '@/lib/sms-templates/authentication-marker';

export interface SmsOptions {
  to: string; // E.164 / international format (+264...)
  message: string;
  reference?: string;
  skipAuthMarkers?: boolean; // Set to true to skip authentication markers (NOT recommended)
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  warning?: string; // e.g., "Message truncated to fit SMS limit"
}

/**
 * Send a single SMS via the configured gateway.
 * Automatically adds authentication markers (SEC-008) unless skipAuthMarkers is true.
 * When env vars are missing, returns success: false with error message (no throw).
 */
export async function sendSms(options: SmsOptions): Promise<SmsResult> {
  const url = process.env.SMS_API_URL;
  const key = process.env.SMS_API_KEY;

  if (!url || !key) {
    console.warn("SMS: SMS_API_URL or SMS_API_KEY not set; skipping send.");
    return {
      success: false,
      error: "SMS gateway not configured",
    };
  }

  // Add authentication markers unless explicitly disabled
  const messageToSend = options.skipAuthMarkers 
    ? options.message 
    : formatSMSWithAuthMarkers(options.message);

  // Check if message was truncated
  let warning: string | undefined;
  if (!options.skipAuthMarkers && messageToSend.length === 160 && options.message.length > 95) {
    warning = "Message truncated to fit SMS limit with security markers";
  }

  const body: Record<string, string> = {
    to: options.to.replace(/\s/g, ""),
    text: messageToSend,
  };
  if (options.reference) body.reference = options.reference;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = (data as { message?: string }).message ?? data?.error ?? response.statusText;
      return { success: false, error: String(errMsg) };
    }

    // Provider-specific: common fields for message ID (adjust per provider)
    const messageId =
      (data as { messageId?: string }).messageId ??
      (data as { message_id?: string }).message_id ??
      (data as { id?: string }).id;

    return { 
      success: true, 
      messageId: messageId ? String(messageId) : undefined,
      warning,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("SMS send error:", message);
    return { success: false, error: message };
  }
}

/**
 * Send authenticated SMS (wrapper for convenience).
 * Always includes authentication markers - recommended for all user-facing SMS.
 */
export async function sendAuthenticatedSMS(options: Omit<SmsOptions, 'skipAuthMarkers'>): Promise<SmsResult> {
  return sendSms({ ...options, skipAuthMarkers: false });
}
