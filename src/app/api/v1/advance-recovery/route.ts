/**
 * POST /api/v1/advance-recovery – Manual advance recovery for beneficiaries
 * 
 * Purpose: Allow Ketchup Portal operators to manually recover outstanding advances
 *          from beneficiaries who received duplicate voucher redemptions.
 * 
 * Security:
 *   - RBAC: Requires 'vouchers.recover_advance' permission (critical financial operation)
 *   - Rate Limit: ADMIN preset (50 requests/minute per user)
 *   - Audit Log: ALL recovery operations logged (regulatory compliance)
 * 
 * Request Body (Open Banking format with data root):
 *   {
 *     "data": {
 *       "beneficiary_id": "uuid",           // Required
 *       "cycle_id": "2026-03-18",           // Optional: defaults to current date
 *       "recovery_amount": 500.00           // Optional: defaults to full outstanding amount
 *     }
 *   }
 * 
 * Response (201 Created):
 *   {
 *     "data": {
 *       "transaction_id": "uuid",
 *       "beneficiary_id": "uuid",
 *       "cycle_id": "2026-03-18",
 *       "recovered_amount": 500.00,
 *       "previous_balance": 1000.00,
 *       "new_balance": 500.00,
 *       "recovery_date": "2026-03-18T10:30:00Z"
 *     }
 *   }
 * 
 * Error Responses:
 *   - 400: No outstanding advance / Recovery amount exceeds outstanding
 *   - 401: Unauthorized (no session)
 *   - 403: Forbidden (missing permission)
 *   - 404: Beneficiary not found
 *   - 429: Rate limit exceeded
 *   - 500: Internal server error
 * 
 * Related:
 *   - Task: BE-001 (TASK.md)
 *   - Service: duplicate-redemption-service.ts
 *   - Schema: beneficiary_advances, advance_recovery_transactions
 */

import { NextRequest } from "next/server";
import {
  getOutstandingAdvance,
  executeManualRecovery,
} from "@/lib/services/duplicate-redemption-service";
import { jsonSuccess, jsonErrorOpenBanking } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/require-permission";
import { getPortalSession } from "@/lib/portal-auth";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ROUTE = "POST /api/v1/advance-recovery";

/**
 * Request body schema (aligned with Open Banking format)
 */
interface ManualRecoveryRequest {
  data: {
    beneficiary_id: string;
    cycle_id?: string;
    recovery_amount?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require vouchers.recover_advance permission (SEC-001)
    const authCheck = await requirePermission(
      request,
      "vouchers.recover_advance",
      ROUTE
    );
    if (authCheck) return authCheck;

    // Rate Limiting: ADMIN preset (50 requests/minute per user) (SEC-004)
    const rateLimitCheck = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitCheck) return rateLimitCheck;

    // Get session (already validated by requirePermission)
    const session = getPortalSession(request);
    if (!session) {
      return jsonErrorOpenBanking(
        "Unauthorized",
        "Unauthorized",
        401,
        { route: ROUTE }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Extract data from Open Banking format (data root) or legacy flat format
    const data: ManualRecoveryRequest["data"] =
      body.data && typeof body.data === "object"
        ? body.data
        : body;

    // Validate required fields
    if (!data.beneficiary_id || typeof data.beneficiary_id !== "string") {
      return jsonErrorOpenBanking(
        "beneficiary_id is required and must be a string",
        "ValidationError",
        400,
        { field: "beneficiary_id", route: ROUTE }
      );
    }

    // Validate optional recovery_amount
    if (
      data.recovery_amount !== undefined &&
      (typeof data.recovery_amount !== "number" || data.recovery_amount <= 0)
    ) {
      return jsonErrorOpenBanking(
        "recovery_amount must be a positive number",
        "ValidationError",
        400,
        { field: "recovery_amount", route: ROUTE }
      );
    }

    // Check if beneficiary exists
    const beneficiary = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.id, data.beneficiary_id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!beneficiary) {
      return jsonErrorOpenBanking(
        `Beneficiary not found: ${data.beneficiary_id}`,
        "NotFound",
        404,
        { route: ROUTE }
      );
    }

    // Get outstanding advance before recovery
    const outstandingBefore = await getOutstandingAdvance(data.beneficiary_id);

    if (outstandingBefore.amount <= 0) {
      return jsonErrorOpenBanking(
        `No outstanding advance to recover for beneficiary: ${data.beneficiary_id}`,
        "NoAdvanceFound",
        400,
        { route: ROUTE }
      );
    }

    // Execute manual recovery
    const result = await executeManualRecovery({
      beneficiaryId: data.beneficiary_id,
      cycleId: data.cycle_id,
      recoveryAmount: data.recovery_amount,
      userId: session.userId,
    });

    // Handle recovery errors
    if (!result.success) {
      return jsonErrorOpenBanking(
        result.message || `Recovery failed for beneficiary: ${data.beneficiary_id}`,
        "RecoveryFailed",
        400,
        { route: ROUTE }
      );
    }

    // Audit logging: CRITICAL financial operation (SEC-002)
    await createAuditLogFromRequest(request, session, {
      action: "advance.manual_recovery" as any,
      resourceType: "beneficiary",
      resourceId: data.beneficiary_id,
      metadata: {
        transactionId: result.transactionId,
        recoveredAmount: result.recoveredAmount,
        previousBalance: outstandingBefore.amount,
        newBalance: result.remainingBalance,
        cycleId: data.cycle_id || new Date().toISOString().split("T")[0],
        operatorId: session.userId,
        beneficiaryName: beneficiary.fullName,
      },
    });

    // Log success for development/debugging
    logger.info(ROUTE, `Manual recovery executed`, {
      beneficiaryId: data.beneficiary_id,
      recoveredAmount: result.recoveredAmount,
      remainingBalance: result.remainingBalance,
      operatorId: session.userId,
    });

    // Return success response (Open Banking format)
    return jsonSuccess(
      {
        transaction_id: result.transactionId,
        beneficiary_id: data.beneficiary_id,
        cycle_id: data.cycle_id || new Date().toISOString().split("T")[0],
        recovered_amount: result.recoveredAmount,
        previous_balance: outstandingBefore.amount,
        new_balance: result.remainingBalance,
        recovery_date: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    // Log error for debugging
    logger.error(
      ROUTE,
      err instanceof Error ? err.message : "Manual recovery error",
      { error: err }
    );

    // Audit log the error (for compliance tracking)
    const session = getPortalSession(request);
    if (session) {
      try {
        await createAuditLogFromRequest(request, session, {
          action: "advance.manual_recovery" as any,
          resourceType: "beneficiary",
          metadata: {
            error: err instanceof Error ? err.message : "Unknown error",
            success: false,
          },
        });
      } catch (auditErr) {
        logger.error(ROUTE, "Failed to log error to audit", { auditErr });
      }
    }

    // Return 500 error
    return jsonErrorOpenBanking(
      "Internal server error during advance recovery",
      "InternalError",
      500,
      { route: ROUTE }
    );
  }
}
