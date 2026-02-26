/**
 * SMS queue helper – Queue an SMS to any phone (agent, field ops, beneficiary).
 * Uses existing sms_queue table; processed by cron POST /api/v1/sms/process.
 * Location: src/lib/services/sms-queue.ts
 * PRD §7.4.1: Extend SMS to agents (float approval, low float), field ops (task assigned).
 */

import { db } from "@/lib/db";
import { smsQueue } from "@/db/schema";

export type SmsReferenceType = "beneficiary" | "voucher" | "agent" | "field_task";

export interface QueueSmsOptions {
  /** E.164 or national format; will be normalized (strip spaces). */
  phone: string;
  message: string;
  referenceType?: SmsReferenceType;
  referenceId?: string;
}

/**
 * Queue a single SMS. Returns the inserted row id or null if phone is empty/invalid.
 * Does not send immediately – cron or POST /api/v1/sms/process sends it.
 */
export async function queueSmsToPhone(options: QueueSmsOptions): Promise<string | null> {
  const phone = options.phone?.replace(/\s/g, "").trim();
  if (!phone || options.message == null || options.message === "") return null;

  const [row] = await db
    .insert(smsQueue)
    .values({
      recipientPhone: phone,
      message: options.message,
      referenceType: options.referenceType ?? null,
      referenceId: options.referenceId ?? null,
    })
    .returning({ id: smsQueue.id });

  return row?.id ?? null;
}
