/**
 * Audit logging for portal actions (PRD §7.5, Audit Report Finding 3.4).
 * Write to audit_logs; redact PII from old_data/new_data (entity_type, entity_id, non-PII fields only).
 * Location: src/lib/audit-log.ts
 */

import { db } from "@/lib/db";
import { auditLogs } from "@/db/schema";

const ROUTE = "audit-log";

/** Entity types that may contain PII – only log non-sensitive field names and redacted values. */
const PII_ENTITY_TYPES = new Set(["beneficiary", "user", "portal_user", "users"]);

function redactForAudit(data: Record<string, unknown> | null): Record<string, unknown> | null {
  if (data == null) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const lower = k.toLowerCase();
    if (
      lower.includes("phone") ||
      lower.includes("email") ||
      lower.includes("name") ||
      lower.includes("password") ||
      lower === "full_name" ||
      lower === "id_number"
    ) {
      out[k] = "[redacted]";
    } else {
      out[k] = v;
    }
  }
  return out;
}

export type AuditPayload = {
  userId: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Insert one audit log row. Redacts PII in old_data/new_data when entityType is in PII_ENTITY_TYPES.
 * Does not throw; logs errors.
 */
export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  try {
    const { entityType, oldData, newData, ...rest } = payload;
    const shouldRedact = entityType && PII_ENTITY_TYPES.has(entityType);
    const safeOld = shouldRedact ? redactForAudit(oldData ?? null) : oldData ?? null;
    const safeNew = shouldRedact ? redactForAudit(newData ?? null) : newData ?? null;
    await db.insert(auditLogs).values({
      userId: rest.userId,
      action: rest.action,
      entityType: entityType ?? null,
      entityId: rest.entityId ?? null,
      oldData: safeOld as Record<string, unknown> | null,
      newData: safeNew as Record<string, unknown> | null,
      ipAddress: rest.ipAddress ?? null,
      userAgent: rest.userAgent ?? null,
    });
  } catch (err) {
    console.error(ROUTE, "writeAuditLog failed", err);
  }
}

/**
 * Log login attempt (success or failure). PRD Audit Finding 3.5.
 * Do not log password or token.
 */
export async function logLoginAttempt(params: {
  success: boolean;
  userId?: string | null;
  identifier?: string; // e.g. email (for failed login we may only have identifier)
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await writeAuditLog({
    userId: params.userId ?? null,
    action: params.success ? "login_success" : "login_failed",
    entityType: "portal_user",
    entityId: params.userId ?? null,
    newData: params.success
      ? undefined
      : { identifier: params.identifier ? "[redacted]" : undefined },
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  });
}
