/**
 * PATCH /api/v1/agent/float/request/:id – Approve or reject a float request (Ketchup finance).
 * Dual control: if amount >= DUAL_CONTROL_FLOAT_THRESHOLD_NAD, first approval sets
 * approved_pending_second (first_reviewed_by/first_reviewed_at); second approval by different user sets approved.
 * On status change: queue SMS to agent contact_phone; create in-app notification for portal users linked to agent.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { floatRequests, agents, portalUsers, agentFloatTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { queueSmsToPhone } from "@/lib/services/sms-queue";
import { createInAppNotification } from "@/lib/services/notifications";
import { shouldSendToAny } from "@/lib/services/notification-preferences";
import { getPortalSession } from "@/lib/portal-auth";
import { writeAuditLog } from "@/lib/audit-log";
import { requirePermission } from "@/lib/require-permission";

const ROUTE_PATCH = "PATCH /api/v1/agent/float/request/[id]";
const DUAL_CONTROL_FLOAT_THRESHOLD_NAD = Number(process.env.DUAL_CONTROL_FLOAT_THRESHOLD_NAD ?? "50000");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, "float_requests.approve", ROUTE_PATCH);
    if (auth) return auth;

    const session = getPortalSession(request);
    if (!session) return jsonError("Unauthorized", "Unauthorized", undefined, 401);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const requestedStatus = body.status;
    const allowedStatuses = ["approved", "rejected", "approved_pending_second"] as const;
    const status = allowedStatuses.includes(requestedStatus) ? requestedStatus : null;
    if (!status) {
      return jsonError("status must be 'approved', 'rejected', or 'approved_pending_second'", "ValidationError", { field: "status" }, 400);
    }

    const [req] = await db
      .select()
      .from(floatRequests)
      .where(eq(floatRequests.id, id))
      .limit(1);
    if (!req) return jsonError("Float request not found", "NotFound", { id }, 404);

    const amountNum = Number(req.amount);
    const needsDualControl = !Number.isNaN(amountNum) && amountNum >= DUAL_CONTROL_FLOAT_THRESHOLD_NAD;

    if (req.status === "pending") {
      if (needsDualControl) {
        if (status === "approved") {
          return jsonError("Large amount requires two approvals; set status to approved_pending_second first", "ValidationError", { threshold: DUAL_CONTROL_FLOAT_THRESHOLD_NAD }, 400);
        }
        if (status === "approved_pending_second") {
          await db
            .update(floatRequests)
            .set({
              status: "approved_pending_second",
              firstReviewedBy: session.userId,
              firstReviewedAt: new Date(),
            })
            .where(eq(floatRequests.id, id));
          await writeAuditLog({
            userId: session.userId,
            action: "float_request_first_approval",
            entityType: "float_request",
            entityId: id,
            newData: { amount: req.amount, status: "approved_pending_second" },
            userAgent: request.headers.get("user-agent") ?? null,
          });
          return Response.json({
            id,
            status: "approved_pending_second",
            first_reviewed_at: new Date().toISOString(),
          });
        }
        // rejected
        await db
          .update(floatRequests)
          .set({
            status: "rejected",
            reviewedBy: session.userId,
            reviewedAt: new Date(),
          })
          .where(eq(floatRequests.id, id));
        await writeAuditLog({
          userId: session.userId,
          action: "float_request_rejected",
          entityType: "float_request",
          entityId: id,
          newData: { amount: req.amount, status: "rejected" },
          userAgent: request.headers.get("user-agent") ?? null,
        });
        await sendFloatNotifications(id, req, "rejected");
        return Response.json({ id, status: "rejected", reviewed_at: new Date().toISOString() });
      }
      // below threshold: single approval
      if (status === "approved_pending_second") {
        return jsonError("Use status 'approved' for amounts below dual-control threshold", "ValidationError", undefined, 400);
      }
      await db
        .update(floatRequests)
        .set({
          status,
          reviewedBy: session.userId,
          reviewedAt: new Date(),
        })
        .where(eq(floatRequests.id, id));
      if (status === "approved") {
        await db.insert(agentFloatTransactions).values({
          agentId: req.agentId,
          amount: req.amount,
          type: "top_up",
          reference: id,
          notes: "Float request approved",
        });
        const [agent] = await db.select().from(agents).where(eq(agents.id, req.agentId)).limit(1);
        if (agent) {
          await db
            .update(agents)
            .set({ floatBalance: String(Number(agent.floatBalance ?? 0) + amountNum) })
            .where(eq(agents.id, req.agentId));
        }
      }
      await writeAuditLog({
        userId: session.userId,
        action: status === "approved" ? "float_request_approved" : "float_request_rejected",
        entityType: "float_request",
        entityId: id,
        newData: { amount: req.amount, status },
        userAgent: request.headers.get("user-agent") ?? null,
      });
      await sendFloatNotifications(id, req, status);
      return Response.json({ id, status, reviewed_at: new Date().toISOString() });
    }

    if (req.status === "approved_pending_second") {
      if (status !== "approved" && status !== "rejected") {
        return jsonError("Second review: status must be 'approved' or 'rejected'", "ValidationError", { field: "status" }, 400);
      }
      if (req.firstReviewedBy === session.userId) {
        return jsonError("Second approval must be by a different user", "ValidationError", undefined, 400);
      }
      await db
        .update(floatRequests)
        .set({
          status,
          reviewedBy: session.userId,
          reviewedAt: new Date(),
        })
        .where(eq(floatRequests.id, id));
      if (status === "approved") {
        await db.insert(agentFloatTransactions).values({
          agentId: req.agentId,
          amount: req.amount,
          type: "top_up",
          reference: id,
          notes: "Float request approved (second sign-off)",
        });
        const [agent] = await db.select().from(agents).where(eq(agents.id, req.agentId)).limit(1);
        if (agent) {
          await db
            .update(agents)
            .set({ floatBalance: String(Number(agent.floatBalance ?? 0) + amountNum) })
            .where(eq(agents.id, req.agentId));
        }
      }
      await writeAuditLog({
        userId: session.userId,
        action: status === "approved" ? "float_request_approved_second" : "float_request_rejected",
        entityType: "float_request",
        entityId: id,
        newData: { amount: req.amount, status },
        userAgent: request.headers.get("user-agent") ?? null,
      });
      await sendFloatNotifications(id, req, status);
      return Response.json({ id, status, reviewed_at: new Date().toISOString() });
    }

    return jsonError("Request already reviewed", "ValidationError", { current_status: req.status }, 400);
  } catch (err) {
    console.error("PATCH /api/v1/agent/float/request/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}

async function sendFloatNotifications(
  id: string,
  req: { agentId: string; amount: string },
  status: string
): Promise<void> {
  const agent = await db.select().from(agents).where(eq(agents.id, req.agentId)).limit(1).then((r) => r[0]);
  const amount = Number(req.amount);
  const amountStr = isNaN(amount) ? req.amount : `N${amount.toLocaleString()}`;

  const portalUsersForAgent = await db
    .select({ id: portalUsers.id })
    .from(portalUsers)
    .where(eq(portalUsers.agentId, req.agentId));
  const portalUserIds = portalUsersForAgent.map((p) => p.id);
  const notifType =
    status === "approved" ? "agent_float_request_approved" : "agent_float_request_rejected";

  if (agent?.contactPhone) {
    const smsEnabled = await shouldSendToAny(portalUserIds, notifType, "sms");
    if (smsEnabled) {
      const message =
        status === "approved"
          ? `Ketchup SmartPay: Your float top-up of ${amountStr} has been approved.`
          : `Ketchup SmartPay: Your float top-up request of ${amountStr} was not approved. Log in for details.`;
      await queueSmsToPhone({
        phone: agent.contactPhone,
        message,
        referenceType: "agent",
        referenceId: id,
      });
    }
  }

  const notifTitle = status === "approved" ? "Float top-up approved" : "Float request rejected";
  const notifBody = `Request ${amountStr} – ${status}.`;
  for (const pu of portalUsersForAgent) {
    await createInAppNotification({
      userId: pu.id,
      title: notifTitle,
      body: notifBody,
      link: "/agent/float",
    });
  }
}
