/**
 * Duplicate redemption & advance recovery service (PRD §3.3.11).
 * Used by portal API routes for duplicate events list, advance ledger, and summary.
 * Location: src/lib/services/duplicate-redemption-service.ts
 */

import { db } from "@/lib/db";
import {
  duplicateRedemptionEvents,
  beneficiaryAdvances,
  users,
  agents,
  vouchers,
  programmes,
} from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export type DuplicateEventStatus =
  | "advance_posted"
  | "under_review"
  | "no_financial_impact"
  | "agent_appealing"
  | "resolved";

export type ListDuplicateEventsFilters = {
  status?: DuplicateEventStatus;
  programmeId?: string;
  from?: string;
  to?: string;
};

export type ListDuplicateEventsParams = {
  page: number;
  limit: number;
  offset: number;
  filters?: ListDuplicateEventsFilters;
};

export type DuplicateEventListItem = {
  id: string;
  voucher_id: string;
  beneficiary_id: string;
  beneficiary_name: string | null;
  duplicate_amount: string;
  canonical_redemption_ref: string;
  duplicate_agent_id: string | null;
  duplicate_agent_name: string | null;
  duplicate_device_id: string | null;
  duplicate_requested_at: string;
  detected_at: string;
  status: string;
  resolution_notes: string | null;
};

export type ListDuplicateEventsResult = {
  data: DuplicateEventListItem[];
  totalRecords: number;
};

export async function listDuplicateEvents(
  params: ListDuplicateEventsParams
): Promise<ListDuplicateEventsResult> {
  const { limit, offset, filters } = params;
  const conditions = [];
  if (filters?.status)
    conditions.push(eq(duplicateRedemptionEvents.status, filters.status));
  if (filters?.from)
    conditions.push(
      gte(duplicateRedemptionEvents.detectedAt, new Date(filters.from))
    );
  if (filters?.to)
    conditions.push(
      lte(duplicateRedemptionEvents.detectedAt, new Date(filters.to))
    );
  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  let rows: {
    id: string;
    voucherId: string;
    beneficiaryId: string;
    duplicateAmount: string | null;
    canonicalRedemptionRef: string;
    duplicateAgentId: string | null;
    duplicateDeviceId: string | null;
    duplicateRequestedAt: Date;
    detectedAt: Date;
    status: string;
    resolutionNotes: string | null;
    beneficiaryName: string | null;
    duplicateAgentName: string | null;
  }[];
  let totalRecords: number;

  if (filters?.programmeId) {
    const programmeWhere = and(
      ...conditions,
      eq(vouchers.programmeId, filters.programmeId)
    );
    const [r, c] = await Promise.all([
      db
        .select({
          id: duplicateRedemptionEvents.id,
          voucherId: duplicateRedemptionEvents.voucherId,
          beneficiaryId: duplicateRedemptionEvents.beneficiaryId,
          duplicateAmount: duplicateRedemptionEvents.duplicateAmount,
          canonicalRedemptionRef: duplicateRedemptionEvents.canonicalRedemptionRef,
          duplicateAgentId: duplicateRedemptionEvents.duplicateAgentId,
          duplicateDeviceId: duplicateRedemptionEvents.duplicateDeviceId,
          duplicateRequestedAt: duplicateRedemptionEvents.duplicateRequestedAt,
          detectedAt: duplicateRedemptionEvents.detectedAt,
          status: duplicateRedemptionEvents.status,
          resolutionNotes: duplicateRedemptionEvents.resolutionNotes,
          beneficiaryName: users.fullName,
          duplicateAgentName: agents.name,
        })
        .from(duplicateRedemptionEvents)
        .innerJoin(vouchers, eq(duplicateRedemptionEvents.voucherId, vouchers.id))
        .leftJoin(users, eq(duplicateRedemptionEvents.beneficiaryId, users.id))
        .leftJoin(agents, eq(duplicateRedemptionEvents.duplicateAgentId, agents.id))
        .where(programmeWhere)
        .orderBy(desc(duplicateRedemptionEvents.detectedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(duplicateRedemptionEvents)
        .innerJoin(vouchers, eq(duplicateRedemptionEvents.voucherId, vouchers.id))
        .where(programmeWhere),
    ]);
    rows = r;
    totalRecords = c[0]?.count ?? 0;
  } else {
    const [r, c] = await Promise.all([
      db
        .select({
          id: duplicateRedemptionEvents.id,
          voucherId: duplicateRedemptionEvents.voucherId,
          beneficiaryId: duplicateRedemptionEvents.beneficiaryId,
          duplicateAmount: duplicateRedemptionEvents.duplicateAmount,
          canonicalRedemptionRef: duplicateRedemptionEvents.canonicalRedemptionRef,
          duplicateAgentId: duplicateRedemptionEvents.duplicateAgentId,
          duplicateDeviceId: duplicateRedemptionEvents.duplicateDeviceId,
          duplicateRequestedAt: duplicateRedemptionEvents.duplicateRequestedAt,
          detectedAt: duplicateRedemptionEvents.detectedAt,
          status: duplicateRedemptionEvents.status,
          resolutionNotes: duplicateRedemptionEvents.resolutionNotes,
          beneficiaryName: users.fullName,
          duplicateAgentName: agents.name,
        })
        .from(duplicateRedemptionEvents)
        .leftJoin(users, eq(duplicateRedemptionEvents.beneficiaryId, users.id))
        .leftJoin(agents, eq(duplicateRedemptionEvents.duplicateAgentId, agents.id))
        .where(whereClause)
        .orderBy(desc(duplicateRedemptionEvents.detectedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(duplicateRedemptionEvents)
        .where(whereClause),
    ]);
    rows = r;
    totalRecords = c[0]?.count ?? 0;
  }

  const data: DuplicateEventListItem[] = rows.map((r) => ({
    id: r.id,
    voucher_id: r.voucherId,
    beneficiary_id: r.beneficiaryId,
    beneficiary_name: r.beneficiaryName ?? null,
    duplicate_amount: r.duplicateAmount ?? "0",
    canonical_redemption_ref: r.canonicalRedemptionRef,
    duplicate_agent_id: r.duplicateAgentId,
    duplicate_agent_name: r.duplicateAgentName ?? null,
    duplicate_device_id: r.duplicateDeviceId,
    duplicate_requested_at: r.duplicateRequestedAt.toISOString(),
    detected_at: r.detectedAt.toISOString(),
    status: r.status,
    resolution_notes: r.resolutionNotes,
  }));

  return { data, totalRecords };
}

export async function getDuplicateEvent(id: string) {
  const row = await db
    .select({
      e: duplicateRedemptionEvents,
      beneficiaryName: users.fullName,
      agentName: agents.name,
    })
    .from(duplicateRedemptionEvents)
    .leftJoin(users, eq(duplicateRedemptionEvents.beneficiaryId, users.id))
    .leftJoin(agents, eq(duplicateRedemptionEvents.duplicateAgentId, agents.id))
    .where(eq(duplicateRedemptionEvents.id, id))
    .limit(1)
    .then((r) => r[0]);
  return row ?? null;
}

export type UpdateDuplicateEventPatch = {
  status?: DuplicateEventStatus;
  resolution_notes?: string;
};

export async function updateDuplicateEvent(
  id: string,
  patch: UpdateDuplicateEventPatch
) {
  const [updated] = await db
    .update(duplicateRedemptionEvents)
    .set({
      ...(patch.status != null && { status: patch.status }),
      ...(patch.resolution_notes != null && {
        resolutionNotes: patch.resolution_notes,
      }),
      ...((patch.status != null || patch.resolution_notes != null) && {
        resolvedAt: new Date(),
      }),
    })
    .where(eq(duplicateRedemptionEvents.id, id))
    .returning();
  return updated ?? null;
}

export type AdvanceLedgerItem = {
  id: string;
  source_event_id: string;
  programme_id: string | null;
  programme_name: string | null;
  original_amount: string;
  recovered_amount: string;
  outstanding_amount: string;
  cycles_outstanding: number;
  status: string;
  created_at: string;
  last_recovery_at: string | null;
};

export type BeneficiaryAdvanceLedgerResult = {
  advances: AdvanceLedgerItem[];
  total_outstanding_nad: string;
};

export async function getBeneficiaryAdvanceLedger(
  beneficiaryId: string
): Promise<BeneficiaryAdvanceLedgerResult> {
  const rows = await db
    .select({
      a: beneficiaryAdvances,
      programmeName: programmes.name,
    })
    .from(beneficiaryAdvances)
    .leftJoin(programmes, eq(beneficiaryAdvances.programmeId, programmes.id))
    .where(eq(beneficiaryAdvances.beneficiaryId, beneficiaryId))
    .orderBy(desc(beneficiaryAdvances.createdAt));

  let totalOutstanding = 0;
  const advances: AdvanceLedgerItem[] = rows.map((r) => {
    const orig = Number(r.a.originalAmount ?? 0);
    const rec = Number(r.a.recoveredAmount ?? 0);
    const out = Math.max(0, orig - rec);
    totalOutstanding += out;
    return {
      id: r.a.id,
      source_event_id: r.a.sourceEventId,
      programme_id: r.a.programmeId,
      programme_name: r.programmeName ?? null,
      original_amount: String(r.a.originalAmount),
      recovered_amount: String(r.a.recoveredAmount ?? "0"),
      outstanding_amount: String(out.toFixed(2)),
      cycles_outstanding: r.a.cyclesOutstanding ?? 0,
      status: r.a.status,
      created_at: r.a.createdAt.toISOString(),
      last_recovery_at: r.a.lastRecoveryAt?.toISOString() ?? null,
    };
  });

  return {
    advances,
    total_outstanding_nad: totalOutstanding.toFixed(2),
  };
}

export type AdvanceLedgerSummaryResult = {
  total_outstanding: string;
  recovery_rate: number;
  count_beneficiaries_affected: number;
  total_duplicates_detected?: number;
  total_over_disbursed_nad?: string;
};

export async function getAdvanceLedgerSummary(
  programmeId?: string
): Promise<AdvanceLedgerSummaryResult> {
  const advanceConditions = [eq(beneficiaryAdvances.status, "outstanding")];
  if (programmeId)
    advanceConditions.push(eq(beneficiaryAdvances.programmeId, programmeId));

  const [outstandingRows, recoveredRows, dupCountRows, overDisbursedRows] =
    await Promise.all([
      db
        .select({
          originalAmount: beneficiaryAdvances.originalAmount,
          recoveredAmount: beneficiaryAdvances.recoveredAmount,
        })
        .from(beneficiaryAdvances)
        .where(and(...advanceConditions)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(beneficiaryAdvances)
        .where(eq(beneficiaryAdvances.status, "fully_recovered")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(duplicateRedemptionEvents),
      db
        .select({
          sum: sql<string>`COALESCE(SUM(${duplicateRedemptionEvents.duplicateAmount}), 0)::text`,
        })
        .from(duplicateRedemptionEvents),
    ]);

  let totalOutstandingNum = 0;
  for (const r of outstandingRows) {
    const o = Number(r.originalAmount ?? 0) - Number(r.recoveredAmount ?? 0);
    if (o > 0) totalOutstandingNum += o;
  }
  const totalRecovered = recoveredRows[0]?.count ?? 0;
  const totalDupEvents = dupCountRows[0]?.count ?? 0;
  const totalAdvanceRows = outstandingRows.length + totalRecovered;
  const recoveryRate =
    totalAdvanceRows > 0
      ? Math.round((totalRecovered / totalAdvanceRows) * 100)
      : 100;

  let beneficiaryCount = outstandingRows.length;
  if (programmeId) {
    const c = await db
      .select({
        count: sql<number>`count(DISTINCT ${beneficiaryAdvances.beneficiaryId})::int`,
      })
      .from(beneficiaryAdvances)
      .where(and(...advanceConditions));
    beneficiaryCount = c[0]?.count ?? 0;
  }

  const totalOverDisbursed = overDisbursedRows[0]
    ? String(overDisbursedRows[0].sum ?? "0")
    : "0";

  return {
    total_outstanding: totalOutstandingNum.toFixed(2),
    recovery_rate: recoveryRate,
    count_beneficiaries_affected: beneficiaryCount,
    total_duplicates_detected: totalDupEvents,
    total_over_disbursed_nad: totalOverDisbursed,
  };
}

export function simulateNextVoucher(
  entitlement: number,
  outstandingAdvance: number
): { amount_deducted: number; net_disbursed: number; remaining_advance: number } {
  const amountDeducted = Math.min(outstandingAdvance, entitlement);
  const netDisbursed = entitlement - amountDeducted;
  const remainingAdvance = outstandingAdvance - amountDeducted;
  return {
    amount_deducted: amountDeducted,
    net_disbursed: netDisbursed,
    remaining_advance: Math.max(0, remainingAdvance),
  };
}
