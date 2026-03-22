/**
 * GET /api/v1/admin/compliance/kri – Key Risk Indicators (PSD-12 Annex B)
 * Returns 12 KRI metrics for compliance monitoring
 * Requires: admin or super_admin role
 * TODO: Connect to SmartPay backend by Agent 7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-access';

const ROUTE = 'GET /api/v1/admin/compliance/kri';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminAccess(request, ROUTE);
  if (authCheck) return authCheck;

  try {
    const mockData = {
      kris: [
        { id: 'kri_capital', name: 'Capital Adequacy', value: 98, threshold: 90, status: 'good' },
        { id: 'kri_liquidity', name: 'Liquidity Ratio', value: 95, threshold: 85, status: 'good' },
        { id: 'kri_operational', name: 'Operational Risk', value: 85, threshold: 80, status: 'warning' },
        { id: 'kri_fraud', name: 'Fraud Rate', value: 0.02, threshold: 0.1, status: 'good', unit: '%' },
        { id: 'kri_availability', name: 'System Availability', value: 99.91, threshold: 99.9, status: 'good', unit: '%' },
        { id: 'kri_compliance', name: 'Compliance Score', value: 96, threshold: 90, status: 'good' },
        { id: 'kri_kyc', name: 'KYC Completion', value: 92, threshold: 95, status: 'warning' },
        { id: 'kri_aml', name: 'AML Alerts', value: 5, threshold: 10, status: 'good' },
        { id: 'kri_data_quality', name: 'Data Quality', value: 97, threshold: 95, status: 'good' },
        { id: 'kri_incident', name: 'Security Incidents', value: 2, threshold: 5, status: 'good' },
        { id: 'kri_response_time', name: 'Avg Response Time', value: 123, threshold: 200, status: 'good', unit: 'ms' },
        { id: 'kri_user_satisfaction', name: 'User Satisfaction', value: 4.7, threshold: 4.0, status: 'good', unit: '★' },
      ],
      lastUpdated: new Date().toISOString(),
      nextUpdate: new Date(Date.now() + 3600000).toISOString(),
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
