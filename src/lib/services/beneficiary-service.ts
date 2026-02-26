/**
 * Beneficiary service – list and filter beneficiaries (PRD §3.2.2).
 * Used by GET /api/v1/beneficiaries. Keeps API routes thin; business logic here.
 * Location: src/lib/services/beneficiary-service.ts
 */

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq, ilike, sql, desc, and } from "drizzle-orm";

export type ListBeneficiariesFilters = {
  status?: string;
  region?: string;
};

export type ListBeneficiariesParams = {
  page: number;
  limit: number;
  offset: number;
  filters?: ListBeneficiariesFilters;
};

export type BeneficiaryListItem = {
  id: string;
  full_name: string | null;
  phone: string | null;
  region: string | null;
  wallet_status: string | null;
  proof_of_life_due_date: string | null;
};

export type ListBeneficiariesResult = {
  data: BeneficiaryListItem[];
  totalRecords: number;
};

/**
 * List beneficiaries with pagination and optional filters (wallet status, region).
 */
export async function listBeneficiaries(
  params: ListBeneficiariesParams
): Promise<ListBeneficiariesResult> {
  const { page, limit, offset, filters } = params;
  const conditions = [];
  if (filters?.status) conditions.push(eq(users.walletStatus, filters.status));
  if (filters?.region) conditions.push(ilike(users.region, `%${filters.region}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: users.id,
        full_name: users.fullName,
        phone: users.phone,
        region: users.region,
        wallet_status: users.walletStatus,
        proof_of_life_due_date: users.proofOfLifeDueDate,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause),
  ]);

  const totalRecords = countRows[0]?.count ?? 0;
  const data: BeneficiaryListItem[] = rows.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    phone: r.phone,
    region: r.region,
    wallet_status: r.wallet_status,
    proof_of_life_due_date: r.proof_of_life_due_date?.toISOString() ?? null,
  }));

  return { data, totalRecords };
}
