/**
 * Unit tests for server env schema (required/optional vars).
 * Location: src/lib/env.test.ts
 */

import { describe, it, expect } from "vitest";
import { serverEnvSchema } from "./env";

describe("serverEnvSchema", () => {
  it("accepts when DATABASE_URL is set", () => {
    const r = serverEnvSchema.safeParse({
      DATABASE_URL: "postgresql://user:pass@host/db?sslmode=require",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.DATABASE_URL).toBe("postgresql://user:pass@host/db?sslmode=require");
      expect(r.data.NEXT_PUBLIC_REQUIRE_AUTH).toBe("");
    }
  });

  it("rejects when DATABASE_URL is missing", () => {
    const r = serverEnvSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("rejects when DATABASE_URL is empty string", () => {
    const r = serverEnvSchema.safeParse({ DATABASE_URL: "" });
    expect(r.success).toBe(false);
  });

  it("accepts optional SMS_API_URL as URL or empty string", () => {
    const r1 = serverEnvSchema.safeParse({
      DATABASE_URL: "postgres://x",
      SMS_API_URL: "https://api.example.com",
    });
    expect(r1.success).toBe(true);
    const r2 = serverEnvSchema.safeParse({
      DATABASE_URL: "postgres://x",
      SMS_API_URL: "",
    });
    expect(r2.success).toBe(true);
  });

  it("accepts optional BUFFR_API_URL and BUFFR_API_KEY", () => {
    const r = serverEnvSchema.safeParse({
      DATABASE_URL: "postgres://x",
      BUFFR_API_URL: "https://pay.buffr.ai",
      BUFFR_API_KEY: "some-key",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.BUFFR_API_URL).toBe("https://pay.buffr.ai");
      expect(r.data.BUFFR_API_KEY).toBe("some-key");
    }
  });
});
