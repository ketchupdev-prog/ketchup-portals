/**
 * Unit tests for voucher-service (issueVoucher with mocked db).
 * Location: src/lib/services/voucher-service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { issueVoucher } from "./voucher-service";
import { db } from "@/lib/db";

const mockInserted = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  status: "available",
  issued_at: new Date("2025-06-01T12:00:00Z"),
};

vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([mockInserted])),
      })),
    })),
  },
}));

describe("issueVoucher", () => {
  beforeEach(() => {
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([mockInserted])),
      })),
    } as unknown as ReturnType<typeof db.insert>);
  });

  it("returns id, status, issued_at when insert succeeds", async () => {
    const result = await issueVoucher({
      beneficiaryId: "550e8400-e29b-41d4-a716-446655440001",
      programmeId: "550e8400-e29b-41d4-a716-446655440002",
      amount: 100,
      expiryDate: "2025-12-31",
    });
    expect(result.id).toBe(mockInserted.id);
    expect(result.status).toBe("available");
    expect(result.issued_at).toBe("2025-06-01T12:00:00.000Z");
  });

  it("throws when insert returns no row", async () => {
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    } as unknown as ReturnType<typeof db.insert>);
    await expect(
      issueVoucher({
        beneficiaryId: "550e8400-e29b-41d4-a716-446655440001",
        programmeId: "550e8400-e29b-41d4-a716-446655440002",
        amount: 50,
        expiryDate: "2025-12-31",
      })
    ).rejects.toThrow("Failed to create voucher");
  });
});
