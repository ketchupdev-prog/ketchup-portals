/**
 * POST /api/v1/reports/programme-performance – Generate Programme Performance PDF Report
 * Location: src/app/api/v1/reports/programme-performance/route.ts
 * 
 * Purpose: Generate downloadable PDF report showing programme performance metrics
 * Required by: TASK.md FE-001 (Government Portal - PDF Report Generation)
 * 
 * Security:
 * - RBAC: Requires 'government.reports' permission (SEC-001)
 * - Rate Limit: ADMIN preset (50/min) - PDF generation is CPU-intensive (SEC-004)
 * - Audit Log: Logs report generation (SEC-002)
 * - Max Records: Limited to 10,000 vouchers per report
 * 
 * Request Body:
 * {
 *   "programmeId": "uuid",
 *   "startDate": "2026-01-01",  // ISO date format
 *   "endDate": "2026-03-18"     // ISO date format
 * }
 * 
 * Response:
 * - Content-Type: application/pdf
 * - Content-Disposition: attachment; filename="programme-performance-YYYY-MM-DD.pdf"
 * - Binary PDF stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { programmes, vouchers, users } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/require-permission';
import { checkRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { getPortalSession } from '@/lib/portal-auth';
import { createAuditLogFromRequest } from '@/lib/services/audit-log-service';
import { jsonError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { generateProgrammeReportPDF, type ProgrammeReportData } from '@/lib/pdf/programme-report';

const ROUTE = 'POST /api/v1/reports/programme-performance';
const MAX_VOUCHERS = 10_000;

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require government.reports permission (SEC-001)
    const auth = await requirePermission(request, 'government.reports', ROUTE);
    if (auth) return auth;

    // Rate limiting: ADMIN preset (50/min) - PDF generation is CPU-intensive (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { programmeId, startDate, endDate } = body;

    // Validation
    if (!programmeId || typeof programmeId !== 'string') {
      return jsonError('programmeId is required', 'ValidationError', { field: 'programmeId' }, 400, ROUTE);
    }
    if (!startDate || typeof startDate !== 'string') {
      return jsonError('startDate is required (ISO format)', 'ValidationError', { field: 'startDate' }, 400, ROUTE);
    }
    if (!endDate || typeof endDate !== 'string') {
      return jsonError('endDate is required (ISO format)', 'ValidationError', { field: 'endDate' }, 400, ROUTE);
    }

    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return jsonError('Invalid date format (use ISO: YYYY-MM-DD)', 'ValidationError', undefined, 400, ROUTE);
    }
    if (startDateObj > endDateObj) {
      return jsonError('startDate must be before endDate', 'ValidationError', undefined, 400, ROUTE);
    }

    // Fetch programme details
    const [programme] = await db
      .select()
      .from(programmes)
      .where(eq(programmes.id, programmeId))
      .limit(1);

    if (!programme) {
      return jsonError('Programme not found', 'NotFound', { programmeId }, 404, ROUTE);
    }

    // Fetch vouchers for this programme within date range
    const vouchersData = await db
      .select({
        status: vouchers.status,
        amount: vouchers.amount,
        region: users.region,
        issued_at: vouchers.issuedAt,
      })
      .from(vouchers)
      .innerJoin(users, eq(vouchers.beneficiaryId, users.id))
      .where(
        and(
          eq(vouchers.programmeId, programmeId),
          gte(vouchers.issuedAt, startDateObj),
          lte(vouchers.issuedAt, endDateObj)
        )
      )
      .limit(MAX_VOUCHERS);

    // Check if too many vouchers
    if (vouchersData.length >= MAX_VOUCHERS) {
      return jsonError(
        'Report too large (>10,000 vouchers). Please narrow date range.',
        'TooManyRecords',
        { limit: MAX_VOUCHERS },
        400,
        ROUTE
      );
    }

    // Calculate summary statistics
    const totalBeneficiaries = await db
      .select({ count: sql<number>`count(distinct ${vouchers.beneficiaryId})::int` })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.programmeId, programmeId),
          gte(vouchers.issuedAt, startDateObj),
          lte(vouchers.issuedAt, endDateObj)
        )
      )
      .then((result) => result[0]?.count ?? 0);

    const voucherStats = {
      available: vouchersData.filter((v) => v.status === 'available').length,
      redeemed: vouchersData.filter((v) => v.status === 'redeemed').length,
      expired: vouchersData.filter((v) => v.status === 'expired').length,
      total: vouchersData.length,
    };

    const redemptionRate = voucherStats.total > 0
      ? (voucherStats.redeemed / voucherStats.total) * 100
      : 0;

    const totalDisbursed = vouchersData.reduce((sum, v) => {
      const amount = parseFloat(v.amount || '0');
      return sum + amount;
    }, 0);

    const allocatedBudget = parseFloat(programme.allocatedBudget || '0');
    const remaining = allocatedBudget - totalDisbursed;
    const disbursementPercentage = allocatedBudget > 0 ? (totalDisbursed / allocatedBudget) * 100 : 0;

    // Calculate regional breakdown
    const regionalMap = new Map<string, {
      budget_allocated: number;
      disbursed: number;
      beneficiaries: Set<string>;
      vouchers_issued: number;
      vouchers_redeemed: number;
    }>();

    for (const voucher of vouchersData) {
      const region = voucher.region || 'Unknown';
      if (!regionalMap.has(region)) {
        regionalMap.set(region, {
          budget_allocated: 0, // Would need per-region budget in DB
          disbursed: 0,
          beneficiaries: new Set(),
          vouchers_issued: 0,
          vouchers_redeemed: 0,
        });
      }
      const stats = regionalMap.get(region)!;
      stats.disbursed += parseFloat(voucher.amount || '0');
      stats.vouchers_issued += 1;
      if (voucher.status === 'redeemed') {
        stats.vouchers_redeemed += 1;
      }
    }

    const regionalBreakdown = Array.from(regionalMap.entries()).map(([region, stats]) => ({
      region,
      budget_allocated: (allocatedBudget / regionalMap.size).toFixed(2), // Equal distribution (simplified)
      disbursed: stats.disbursed.toFixed(2),
      beneficiaries: stats.beneficiaries.size,
      vouchers_issued: stats.vouchers_issued,
      redemption_rate: stats.vouchers_issued > 0
        ? (stats.vouchers_redeemed / stats.vouchers_issued) * 100
        : 0,
    }));

    // Build report data
    const reportData: ProgrammeReportData = {
      programme: {
        id: programme.id,
        name: programme.name,
        description: programme.description,
        allocated_budget: programme.allocatedBudget,
        spent_to_date: programme.spentToDate,
        start_date: programme.startDate,
        end_date: programme.endDate,
      },
      period: {
        start_date: startDate,
        end_date: endDate,
      },
      summary: {
        total_budget: allocatedBudget.toFixed(2),
        disbursed: totalDisbursed.toFixed(2),
        remaining: remaining.toFixed(2),
        disbursement_percentage: disbursementPercentage,
        total_beneficiaries: totalBeneficiaries,
        vouchers_issued: voucherStats.total,
        vouchers_redeemed: voucherStats.redeemed,
        redemption_rate: redemptionRate,
      },
      regional_breakdown: regionalBreakdown,
      voucher_statistics: voucherStats,
    };

    // Generate PDF
    const pdfBuffer = await generateProgrammeReportPDF(reportData);

    // Audit logging: Report generation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'report.generated' as any,
        resourceType: 'programme',
        resourceId: programmeId,
        metadata: {
          report_type: 'programme_performance',
          start_date: startDate,
          end_date: endDate,
          vouchers_count: voucherStats.total,
        },
      });
    }

    // Return PDF as download
    const filename = `programme-performance-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Convert Buffer to Uint8Array for Next.js Response
    const uint8Array = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    logger.error(ROUTE, err instanceof Error ? err.message : 'Internal server error', {
      error: err,
    });
    return jsonError('Internal server error', 'InternalError', undefined, 500, ROUTE);
  }
}
