/**
 * GET /api/v1/admin/security/overview – Security metrics overview
 * Returns security score, fraud attempts, 2FA adoption, failed logins
 * Requires: admin or super_admin role
 * TODO: Connect to SmartPay backend by Agent 7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-access';

const ROUTE = 'GET /api/v1/admin/security/overview';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdminAccess(request, ROUTE);
  if (authCheck) return authCheck;

  try {
    const mockData = {
      securityScore: 96,
      fraudAttempts24h: 12,
      twoFaAdoption: 87,
      failedLogins24h: 34,
      recentEvents: [
        {
          timestamp: new Date(Date.now() - 900000).toISOString(),
          event: 'Suspicious login blocked',
          severity: 'warning',
          details: 'Multiple failed attempts from 185.220.101.23',
        },
        {
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          event: 'Multiple failed login attempts',
          severity: 'error',
          details: '5 consecutive failures from user account',
        },
        {
          timestamp: new Date(Date.now() - 2700000).toISOString(),
          event: '2FA enabled by user',
          severity: 'success',
          details: 'User USR-12345 enabled 2FA',
        },
      ],
      recommendations: [
        { priority: 'high', message: '13% of users still not using 2FA - send reminder' },
        { priority: 'medium', message: 'Consider implementing CAPTCHA for login page' },
        { priority: 'low', message: 'All API keys rotated in last 90 days' },
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
