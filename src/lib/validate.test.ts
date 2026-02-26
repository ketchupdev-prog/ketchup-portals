/**
 * Unit tests for Zod schemas and validateBody/validateId (Rule 12).
 * Location: src/lib/validate.test.ts
 */

import { describe, it, expect } from "vitest";
import { schemas, validateBody, validateId } from "./validate";

describe("schemas.uuid", () => {
  it("accepts valid UUID", () => {
    const r = schemas.uuid.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(r.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const r = schemas.uuid.safeParse("not-a-uuid");
    expect(r.success).toBe(false);
  });
});

describe("schemas.login", () => {
  it("accepts valid email and password", () => {
    const r = schemas.login.safeParse({ email: "a@b.co", password: "secret" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("a@b.co");
  });

  it("rejects empty email", () => {
    const r = schemas.login.safeParse({ email: "", password: "x" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = schemas.login.safeParse({ email: "notanemail", password: "x" });
    expect(r.success).toBe(false);
  });
});

describe("schemas.voucherIssue", () => {
  it("accepts valid payload", () => {
    const r = schemas.voucherIssue.safeParse({
      beneficiary_id: "550e8400-e29b-41d4-a716-446655440000",
      programme_id: "550e8400-e29b-41d4-a716-446655440001",
      amount: 100,
      expiry_date: "2025-12-31",
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-positive amount", () => {
    const r = schemas.voucherIssue.safeParse({
      beneficiary_id: "550e8400-e29b-41d4-a716-446655440000",
      programme_id: "550e8400-e29b-41d4-a716-446655440001",
      amount: 0,
      expiry_date: "2025-12-31",
    });
    expect(r.success).toBe(false);
  });
});

describe("validateBody", () => {
  it("returns data on success", () => {
    const out = validateBody(schemas.login, { email: "a@b.co", password: "p" });
    expect(out.success).toBe(true);
    if (out.success) expect(out.data.email).toBe("a@b.co");
  });

  it("returns error and details on failure", () => {
    const out = validateBody(schemas.login, { email: "bad" });
    expect(out.success).toBe(false);
    if (!out.success) {
      expect(out.error).toBeDefined();
      expect(out.details?.field).toBeDefined();
    }
  });
});

describe("validateId", () => {
  it("returns data for valid UUID", () => {
    const out = validateId("550e8400-e29b-41d4-a716-446655440000");
    expect(out.success).toBe(true);
    if (out.success) expect(out.data).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("returns error for invalid id", () => {
    const out = validateId("not-a-uuid");
    expect(out.success).toBe(false);
    if (!out.success) expect(out.error).toContain("Invalid");
  });
});
