/**
 * GET /api/v1/admin/ai-ml/copilot – AI Copilot performance metrics
 * Returns usage, accuracy, and performance data
 * Requires: admin or super_admin role
 * TODO: Connect to SmartPay backend by Agent 7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-access';

const ROUTE = 'GET /api/v1/admin/ai-ml/copilot';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminAccess(request, ROUTE);
  if (authCheck) return authCheck;

  try {
    const mockData = {
      activeSessions: 89,
      avgAccuracy: 94.2,
      avgResponseTime: 1.8,
      userSatisfaction: 4.6,
      usageByPortal: [
        { portal: 'Ketchup Portal', queries: 456, percentage: 45 },
        { portal: 'Government Portal', queries: 234, percentage: 23 },
        { portal: 'Agent Portal', queries: 189, percentage: 19 },
        { portal: 'Field Ops Portal', queries: 132, percentage: 13 },
      ],
      topQueries: [
        { type: 'Beneficiary lookup', count: 234, accuracy: 96 },
        { type: 'Voucher status', count: 189, accuracy: 95 },
        { type: 'Compliance check', count: 145, accuracy: 88 },
        { type: 'Transaction analysis', count: 98, accuracy: 93 },
      ],
      trends: {
        queriesGrowth: 12,
        accuracyImprovement: 2.1,
        responseTimeImprovement: -0.3,
        satisfactionGrowth: 0.2,
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
