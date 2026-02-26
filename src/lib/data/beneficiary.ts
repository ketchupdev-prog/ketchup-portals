/**
 * Server-side data for beneficiary detail (PRD §3.2.2).
 * Used by Ketchup beneficiary detail page to avoid sample data.
 * Location: src/lib/data/beneficiary.ts
 */

import { db } from "@/lib/db";
import { users, vouchers, transactions, proofOfLifeEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getBeneficiary(id: string) {
  const row = await db.select().from(users).where(eq(users.id, id)).limit(1).then((r) => r[0]);
  if (!row) return null;
  return {
    id: row.id,
    name: row.fullName,
    phone: row.phone,
    region: row.region ?? "",
    status: row.walletStatus,
    idNumber: row.idNumber ?? "",
    proofOfLifeDueDate: row.proofOfLifeDueDate?.toISOString() ?? null,
  };
}

export async function getBeneficiaryVouchers(beneficiaryId: string) {
  const rows = await db
    .select({
      id: vouchers.id,
      amount: vouchers.amount,
      status: vouchers.status,
      issuedAt: vouchers.issuedAt,
      redeemedAt: vouchers.redeemedAt,
    })
    .from(vouchers)
    .where(eq(vouchers.beneficiaryId, beneficiaryId))
    .orderBy(desc(vouchers.issuedAt))
    .limit(100);
  return rows.map((r) => ({
    id: r.id,
    code: r.id.slice(0, 8),
    amount: r.amount != null ? `NAD ${Number(r.amount).toLocaleString()}` : "—",
    status: r.status,
    issuedAt: r.issuedAt.toISOString().slice(0, 10),
    redeemedAt: r.redeemedAt?.toISOString().slice(0, 10),
  }));
}

export async function getBeneficiaryTransactions(beneficiaryId: string) {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.beneficiaryId, beneficiaryId))
    .orderBy(desc(transactions.timestamp))
    .limit(100);
  return rows.map((r) => ({
    id: r.id,
    date: r.timestamp.toISOString().slice(0, 10),
    type: r.type,
    amount: r.amount != null ? `NAD ${Number(r.amount).toLocaleString()}` : "—",
    reference: r.method ?? r.id.slice(0, 8),
  }));
}

export async function getProofOfLifeEvents(userId: string) {
  const rows = await db
    .select({ id: proofOfLifeEvents.id, method: proofOfLifeEvents.method, timestamp: proofOfLifeEvents.timestamp })
    .from(proofOfLifeEvents)
    .where(eq(proofOfLifeEvents.userId, userId))
    .orderBy(desc(proofOfLifeEvents.timestamp))
    .limit(50);
  return rows.map((r) => ({
    id: r.id,
    method: r.method,
    timestamp: r.timestamp.toISOString().slice(0, 19).replace("T", " "),
    performedBy: "System",
  }));
}
