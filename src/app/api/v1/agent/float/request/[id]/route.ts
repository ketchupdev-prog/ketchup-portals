/**
 * PATCH /api/v1/agent/float/request/:id – Approve or reject a float request (Ketchup finance).
 * On status change: queue SMS to agent contact_phone; create in-app notification for portal users linked to agent.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { floatRequests, agents, portalUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { jsonError } from "@/lib/api-response";
import { queueSmsToPhone } from "@/lib/services/sms-queue";
import { createInAppNotification } from "@/lib/services/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
    if (!status) return jsonError("status must be 'approved' or 'rejected'", "ValidationError", { field: "status" }, 400);

    const [req] = await db
      .select()
      .from(floatRequests)
      .where(eq(floatRequests.id, id))
      .limit(1);
    if (!req) return jsonError("Float request not found", "NotFound", { id }, 404);
    if (req.status !== "pending") return jsonError("Request already reviewed", "ValidationError", { current_status: req.status }, 400);

    const reviewedBy = body.reviewed_by ?? null;
    await db
      .update(floatRequests)
      .set({
        status,
        reviewedBy: reviewedBy || null,
        reviewedAt: new Date(),
      })
      .where(eq(floatRequests.id, id));

    const agent = await db.select().from(agents).where(eq(agents.id, req.agentId)).limit(1).then((r) => r[0]);
    const amount = Number(req.amount);
    const amountStr = isNaN(amount) ? req.amount : `N${amount.toLocaleString()}`;

    if (agent?.contactPhone) {
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

    const portalUsersForAgent = await db
      .select({ id: portalUsers.id })
      .from(portalUsers)
      .where(eq(portalUsers.agentId, req.agentId));
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

    return Response.json({ id, status, reviewed_at: new Date().toISOString() });
  } catch (err) {
    console.error("PATCH /api/v1/agent/float/request/[id] error:", err);
    return jsonError("Internal server error", "InternalError", undefined, 500);
  }
}
