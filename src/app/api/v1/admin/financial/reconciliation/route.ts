/**
 * GET /api/v1/admin/financial/reconciliation – Trust account reconciliation status
 * Returns daily reconciliation data (PSD-3 §18)
 * Requires: admin or super_admin role
 * TODO: Connect to SmartPay backend by Agent 7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-access';

const ROUTE = 'GET /api/v1/admin/financial/reconciliation';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminAccess(request, ROUTE);
  if (authCheck) return authCheck;

  try {
    const mockData = {
      current: {
        trustBalance: 12456789.0,
        systemBalance: 12456789.0,
        discrepancy: 0.0,
        status: 'reconciled',
        lastReconciled: new Date().toISOString(),
      },
      history: [
        {
          date: '2026-03-22',
          trustBalance: 12456789.0,
          systemBalance: 12456789.0,
          discrepancy: 0.0,
          status: 'reconciled',
        },
        {
          date: '2026-03-21',
          trustBalance: 12234567.0,
          systemBalance: 12234567.0,
          discrepancy: 0.0,
          status: 'reconciled',
        },
        {
          date: '2026-03-20',
          trustBalance: 11987654.0,
          systemBalance: 11987654.0,
          discrepancy: 0.0,
          status: 'reconciled',
        },
      ],
      stats: {
        consecutiveDaysReconciled: 45,
        avgReconciliationTime: 15,
        lastDiscrepancy: null,
      },
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
