/**
 * Voucher service – list, filter, and issue vouchers (PRD §3.2.3).
 * Used by GET /api/v1/vouchers and POST /api/v1/vouchers/issue.
 * Location: src/lib/services/voucher-service.ts
 */

import { db } from "@/lib/db";
import { vouchers, users, programmes } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";

export type ListVouchersFilters = {
  status?: string;
  beneficiaryId?: string;
  programmeId?: string;
};

export type ListVouchersParams = {
  page: number;
  limit: number;
  offset: number;
  filters?: ListVouchersFilters;
};

export type VoucherListItem = {
  id: string;
  beneficiary_id: string;
  programme_id: string;
  beneficiary_name: string | null;
  programme_name: string | null;
  amount: string | null;
  status: string | null;
  issued_at: string;
  redeemed_at: string | null;
  expiry_date: string | null;
  loan_deduction: string | null;
};

export type ListVouchersResult = {
  data: VoucherListItem[];
  totalRecords: number;
};

/**
 * List vouchers with pagination and optional filters.
 */
export async function listVouchers(
  params: ListVouchersParams
): Promise<ListVouchersResult> {
  const { limit, offset, filters } = params;
  const conditions = [];
  if (filters?.status) conditions.push(eq(vouchers.status, filters.status));
  if (filters?.beneficiaryId)
    conditions.push(eq(vouchers.beneficiaryId, filters.beneficiaryId));
  if (filters?.programmeId)
    conditions.push(eq(vouchers.programmeId, filters.programmeId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: vouchers.id,
        beneficiaryId: vouchers.beneficiaryId,
        programmeId: vouchers.programmeId,
        amount: vouchers.amount,
        status: vouchers.status,
        issuedAt: vouchers.issuedAt,
        redeemedAt: vouchers.redeemedAt,
        expiryDate: vouchers.expiryDate,
        loanDeduction: vouchers.loanDeduction,
        beneficiaryName: users.fullName,
        programmeName: programmes.name,
      })
      .from(vouchers)
      .leftJoin(users, eq(vouchers.beneficiaryId, users.id))
      .leftJoin(programmes, eq(vouchers.programmeId, programmes.id))
      .where(whereClause)
      .orderBy(desc(vouchers.issuedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(vouchers)
      .where(whereClause),
  ]);

  const totalRecords = countRows[0]?.count ?? 0;
  const data: VoucherListItem[] = rows.map((r) => ({
    id: r.id,
    beneficiary_id: r.beneficiaryId,
    programme_id: r.programmeId,
    beneficiary_name: r.beneficiaryName ?? null,
    programme_name: r.programmeName ?? null,
    amount: r.amount,
    status: r.status,
    issued_at: r.issuedAt.toISOString(),
    redeemed_at: r.redeemedAt?.toISOString() ?? null,
    expiry_date: r.expiryDate,
    loan_deduction: r.loanDeduction,
  }));

  return { data, totalRecords };
}

export type IssueVoucherParams = {
  beneficiaryId: string;
  programmeId: string;
  amount: number;
  expiryDate: string;
};

export type IssueVoucherResult = {
  id: string;
  status: string;
  issued_at: string | null;
};

/**
 * Issue a single voucher. Caller should validate params (Zod) before calling.
 */
export async function issueVoucher(
  params: IssueVoucherParams
): Promise<IssueVoucherResult> {
  const [inserted] = await db
    .insert(vouchers)
    .values({
      beneficiaryId: params.beneficiaryId,
      programmeId: params.programmeId,
      amount: String(params.amount),
      status: "available",
      expiryDate: params.expiryDate,
    })
    .returning({
      id: vouchers.id,
      status: vouchers.status,
      issued_at: vouchers.issuedAt,
    });

  if (!inserted) {
    throw new Error("Failed to create voucher");
  }

  return {
    id: inserted.id,
    status: inserted.status,
    issued_at: inserted.issued_at?.toISOString() ?? null,
  };
}
