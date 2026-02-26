/**
 * GET /api/v1/portal/dashboard/summary – Ketchup dashboard KPIs (counts).
 * Returns activeVouchers, beneficiariesCount, agentsCount, pendingFloatRequestsCount.
 * Auth required; restricted to ketchup_* roles. PRD §10.2, DATABASE_AND_API_DESIGN.md §3.2.
 */

import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { vouchers, users, agents, floatRequests } from '@/db/schema';
import { getPortalSession } from '@/lib/portal-auth';
import { jsonError } from '@/lib/api-response';
import { requirePermission } from '@/lib/require-permission';

const ROUTE = 'GET /api/v1/portal/dashboard/summary';

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'dashboard.summary', ROUTE);
    if (auth) return auth;

    const [activeVouchersRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vouchers)
      .where(eq(vouchers.status, 'available'));

    const [beneficiariesRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    const [agentsRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agents);

    const [pendingFloatRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(floatRequests)
      .where(eq(floatRequests.status, 'pending'));

    const data = {
      activeVouchers: activeVouchersRow?.count ?? 0,
      beneficiariesCount: beneficiariesRow?.count ?? 0,
      agentsCount: agentsRow?.count ?? 0,
      pendingFloatRequestsCount: pendingFloatRow?.count ?? 0,
    };

    return Response.json({ data });
  } catch (err) {
    console.error(ROUTE, err);
    return jsonError('Internal server error', 'InternalError', undefined, 500, ROUTE);
  }
}
