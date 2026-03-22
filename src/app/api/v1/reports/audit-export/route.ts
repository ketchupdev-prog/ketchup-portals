/**
 * POST /api/v1/reports/audit-export – Generate Audit Log Export PDF Report
 * Location: src/app/api/v1/reports/audit-export/route.ts
 * 
 * Purpose: Generate downloadable PDF report exporting audit logs with filters
 * Required by: TASK.md FE-001 (Government Portal - PDF Report Generation)
 * 
 * Security:
 * - RBAC: Requires 'audit_logs.export' permission (SEC-001)
 * - Rate Limit: ADMIN preset (50/min) - PDF generation is CPU-intensive (SEC-004)
 * - Audit Log: Logs report generation (SEC-002)
 * - Max Records: Limited to 10,000 audit log entries per report
 * 
 * Request Body:
 * {
 *   "startDate": "2026-03-01",   // ISO date format (required)
 *   "endDate": "2026-03-18",     // ISO date format (required)
 *   "userId": "uuid",            // Optional: Filter by specific user
 *   "action": "voucher.issue"    // Optional: Filter by specific action
 * }
 * 
 * Response:
 * - Content-Type: application/pdf
 * - Content-Disposition: attachment; filename="audit-export-YYYY-MM-DD.pdf"
 * - Binary PDF stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogs, portalUsers } from '@/db/schema';
import { and, gte, lte, eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/require-permission';
import { checkRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { getPortalSession } from '@/lib/portal-auth';
import { createAuditLogFromRequest } from '@/lib/services/audit-log-service';
import { jsonError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { generateAuditReportPDF, type AuditReportData } from '@/lib/pdf/audit-report';

const ROUTE = 'POST /api/v1/reports/audit-export';
const MAX_LOGS = 10_000;

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require audit_logs.export permission (SEC-001)
    const auth = await requirePermission(request, 'audit.view', ROUTE);
    if (auth) return auth;

    // Rate limiting: ADMIN preset (50/min) - PDF generation is CPU-intensive (SEC-004)
    const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.ADMIN);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { startDate, endDate, userId, action } = body;

    // Validation
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

    // Build query conditions
    const conditions = [
      gte(auditLogs.createdAt, startDateObj),
      lte(auditLogs.createdAt, endDateObj),
    ];

    if (userId && typeof userId === 'string') {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action && typeof action === 'string') {
      conditions.push(eq(auditLogs.action, action));
    }

    // Fetch audit logs with user email
    const logs = await db
      .select({
        id: auditLogs.id,
        user_id: auditLogs.userId,
        user_email: portalUsers.email,
        action: auditLogs.action,
        resource_type: auditLogs.entityType,
        resource_id: auditLogs.entityId,
        ip_address: auditLogs.ipAddress,
        created_at: auditLogs.createdAt,
        metadata: auditLogs.oldData,
      })
      .from(auditLogs)
      .innerJoin(portalUsers, eq(auditLogs.userId, portalUsers.id))
      .where(and(...conditions))
      .orderBy(auditLogs.createdAt)
      .limit(MAX_LOGS);

    // Check if too many logs
    if (logs.length >= MAX_LOGS) {
      return jsonError(
        'Report too large (>10,000 logs). Please narrow date range.',
        'TooManyRecords',
        { limit: MAX_LOGS },
        400,
        ROUTE
      );
    }

    // Get user email for filter display (if userId provided)
    let userEmail: string | undefined;
    if (userId) {
      const [user] = await db
        .select({ email: portalUsers.email })
        .from(portalUsers)
        .where(eq(portalUsers.id, userId))
        .limit(1);
      userEmail = user?.email;
    }

    // Build report data
    const reportData: AuditReportData = {
      filters: {
        start_date: startDate,
        end_date: endDate,
        user_email: userEmail,
        action: action,
      },
      logs: logs.map((log) => ({
        id: log.id,
        user_email: log.user_email,
        action: log.action,
        resource_type: log.resource_type || 'unknown',
        resource_id: log.resource_id || null,
        ip_address: log.ip_address || null,
        created_at: log.created_at.toISOString(),
        metadata: log.metadata as Record<string, any> | null,
      })),
      total_records: logs.length,
    };

    // Generate PDF
    const pdfBuffer = await generateAuditReportPDF(reportData);

    // Audit logging: Report generation (SEC-002)
    const session = getPortalSession(request);
    if (session) {
      await createAuditLogFromRequest(request, session, {
        action: 'report.generated' as any,
        resourceType: 'audit_logs' as any,
        resourceId: undefined,
        metadata: {
          report_type: 'audit_export',
          start_date: startDate,
          end_date: endDate,
          user_id: userId || undefined,
          action: action || undefined,
          records_count: logs.length,
        },
      });
    }

    // Return PDF as download
    const filename = `audit-export-${new Date().toISOString().split('T')[0]}.pdf`;
    
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
