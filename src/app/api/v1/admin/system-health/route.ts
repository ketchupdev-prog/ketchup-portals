/**
 * GET /api/v1/admin/system-health – System health metrics
 * Returns overall system health, compliance, financial, and security scores
 * Requires: admin or super_admin role
 * TODO: Connect to SmartPay backend by Agent 7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-access';

const ROUTE = 'GET /api/v1/admin/system-health';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminAccess(request, ROUTE);
  if (authCheck) return authCheck;

  try {
    const mockData = {
      systemHealth: 94,
      complianceStatus: 95,
      financialHealth: 98,
      securityScore: 96,
      uptime24h: 99.91,
      uptime7d: 99.95,
      uptime30d: 99.92,
      activeAlerts: {
        critical: 3,
        warning: 5,
        info: 2,
      },
      timestamp: new Date().toISOString(),
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
