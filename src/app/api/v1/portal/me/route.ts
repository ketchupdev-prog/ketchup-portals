/**
 * GET /api/v1/portal/me – Current portal user from session (cookie or Bearer).
 * Response: { id, email, full_name, role, agent_id, phone } or 401.
 */

import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { portalUsers } from '@/db/schema';
import { getPortalSession } from '@/lib/portal-auth';
import { jsonError } from '@/lib/api-response';

const ROUTE = 'GET /api/v1/portal/me';

export async function GET(request: NextRequest) {
  try {
    const session = getPortalSession(request);
    if (!session) {
      return jsonError('Unauthorized', 'Unauthorized', undefined, 401, ROUTE);
    }

    const [user] = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
        fullName: portalUsers.fullName,
        role: portalUsers.role,
        agentId: portalUsers.agentId,
        phone: portalUsers.phone,
      })
      .from(portalUsers)
      .where(eq(portalUsers.id, session.userId))
      .limit(1);

    if (!user) {
      return jsonError('User not found', 'NotFound', undefined, 401, ROUTE);
    }

    return Response.json({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      agent_id: user.agentId,
      phone: user.phone,
    });
  } catch (err) {
    console.error(ROUTE, err);
    return jsonError('Internal server error', 'InternalError', undefined, 500, ROUTE);
  }
}
