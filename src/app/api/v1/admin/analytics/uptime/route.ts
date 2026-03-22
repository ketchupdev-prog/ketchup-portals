/**
 * GET /api/v1/admin/analytics/uptime – Uptime metrics (99.9% SLA tracking per PSD-12 §10)
 * Returns uptime percentages and incident history
 * Requires: admin or super_admin role
 * TODO: Connect to SmartPay backend by Agent 7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-access';

const ROUTE = 'GET /api/v1/admin/analytics/uptime';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminAccess(request, ROUTE);
  if (authCheck) return authCheck;

  try {
    const mockData = {
      sla: {
        target: 99.9,
        current24h: 99.91,
        current7d: 99.95,
        current30d: 99.92,
        status: 'above_sla',
      },
      services: [
        {
          name: 'Ketchup Portals',
          status: 'operational',
          uptime24h: 100.0,
          uptime7d: 99.98,
          uptime30d: 99.95,
          lastIncident: null,
        },
        {
          name: 'SmartPay API',
          status: 'operational',
          uptime24h: 99.95,
          uptime7d: 99.92,
          uptime30d: 99.89,
          lastIncident: '2026-03-15T14:23:00Z',
        },
        {
          name: 'SmartPay Mobile',
          status: 'operational',
          uptime24h: 100.0,
          uptime7d: 100.0,
          uptime30d: 99.97,
          lastIncident: '2026-03-10T08:15:00Z',
        },
        {
          name: 'Database',
          status: 'operational',
          uptime24h: 100.0,
          uptime7d: 100.0,
          uptime30d: 99.99,
          lastIncident: '2026-02-28T12:30:00Z',
        },
      ],
      incidents30d: [
        {
          date: '2026-03-15T14:23:00Z',
          service: 'SmartPay API',
          duration: 25,
          impact: 'Elevated error rates',
          status: 'resolved',
        },
        {
          date: '2026-03-10T08:15:00Z',
          service: 'SmartPay Mobile',
          duration: 20,
          impact: 'Login issues',
          status: 'resolved',
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: mockData,
      meta: { route: ROUTE, cached: false },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
