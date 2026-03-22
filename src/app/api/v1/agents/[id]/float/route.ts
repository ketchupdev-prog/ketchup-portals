/**
 * PATCH /api/v1/agents/[id]/float – Adjust agent float balance.
 * Roles: ketchup_finance (RBAC enforced: float_requests.approve permission).
 * Secured: RBAC, rate limiting, CRITICAL audit logging (financial operation).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { agents, agentFloatTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/require-permission";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createAuditLogFromRequest } from "@/lib/services/audit-log-service";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

const ROUTE = "PATCH /api/v1/agents/[id]/float";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC: Require float_requests.approve permission (SEC-001)
    const auth = await requirePermission(request, "float_requests.approve", ROUTE);
    if (auth) return auth;

    // Rate limiting: Float approval endpoint (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.FLOAT_APPROVAL);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const type = body.type ?? "adjustment";
    
    if (Number.isNaN(amount) || amount === 0) {
      return jsonError(
        "amount must be a non-zero number",
        "ValidationError",
        { field: "amount" },
        400,
        ROUTE
      );
    }

    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1)
      .then((r) => r[0]);
    
    if (!agent) {
      return jsonError("Agent not found", "NotFound", { id }, 404, ROUTE);
    }

    const current = Number(agent.floatBalance ?? 0);
    const newBalance = String(current + amount);
    const transactionType = 
      type === "top_up" || type === "settlement" || type === "adjustment" 
        ? type 
        : "adjustment";

    await db.update(agents).set({ floatBalance: newBalance }).where(eq(agents.id, id));
    
    const [transaction] = await db
      .insert(agentFloatTransactions)
      .values({
        agentId: id,
        amount: String(Math.abs(amount)),
        type: transactionType,
        notes: body.notes ?? null,
      })
      .returning({ id: agentFloatTransactions.id });

    // Audit logging: CRITICAL financial operation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'agent.float_adjust',
        resourceType: 'agent',
        resourceId: id,
        metadata: {
          agentName: agent.name,
          previousBalance: agent.floatBalance,
          newBalance: newBalance,
          adjustmentAmount: String(amount),
          transactionType: transactionType,
          transactionId: transaction?.id,
          notes: body.notes,
        },
      });
    }

    return jsonSuccess({ 
      float_balance: newBalance,
      previous_balance: agent.floatBalance,
      adjustment: String(amount),
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : "Error", { error: err });
    return jsonError("Internal server error", "InternalError", undefined, 500, ROUTE);
  }
}
