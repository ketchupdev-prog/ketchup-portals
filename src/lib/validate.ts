/**
 * Shared validation for API request bodies and params.
 * Uses Zod; return first error message for jsonError.
 * Location: src/lib/validate.ts
 */

import { z } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const schemas = {
  uuid: z.string().regex(UUID_REGEX, "Invalid ID format"),
  idParam: z.string().min(1, "ID is required").regex(UUID_REGEX, "Invalid ID format"),
  login: z.object({
    email: z.string().min(1, "Email is required").email("Invalid email").transform((s) => s.trim()),
    password: z.string().min(1, "Password is required"),
  }),
  register: z.object({
    email: z.string().min(1, "Email is required").email("Invalid email").transform((s) => s.trim().toLowerCase()),
    password: z.string().min(8, "Password must be at least 8 characters"),
    full_name: z.string().min(1, "Full name is required").transform((s) => s.trim()),
    role: z.enum(["ketchup_ops", "ketchup_compliance", "ketchup_finance", "ketchup_support", "gov_manager", "gov_auditor", "agent", "field_tech", "field_lead"]).default("field_tech"),
  }),
  beneficiarySms: z.object({
    message: z.string().max(1600).optional().default(""),
  }),
  bulkSms: z.object({
    beneficiary_ids: z.array(z.string().uuid()).min(1, "At least one beneficiary_id required"),
    message: z.string().max(1600).optional(),
  }),
  floatRequest: z.object({
    agent_id: z.string().uuid().optional(),
    amount: z.number().positive("Amount must be positive"),
  }),
  voucherIssue: z.object({
    beneficiary_id: z.string().uuid(),
    programme_id: z.string().uuid(),
    amount: z.number().positive("Amount must be positive"),
    expiry_date: z.string().min(1, "expiry_date is required"),
  }),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, unknown> };

function firstZodError(err: z.ZodError): { message: string; field?: string } {
  const e = err.issues[0];
  const path = e?.path?.join(".") ?? "body";
  const msg = (e && "message" in e ? e.message : undefined) ?? "Validation failed";
  return { message: String(msg), field: path };
}

export function validateBody<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const { message, field } = firstZodError(result.error);
  return {
    success: false,
    error: message,
    details: { field },
  };
}

export function validateId(id: string): ValidationResult<string> {
  const result = schemas.uuid.safeParse(id);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: "Invalid ID format", details: { field: "id" } };
}
