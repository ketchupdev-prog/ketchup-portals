/**
 * Audit Log Service – Automatically log sensitive operations to database
 * Location: src/lib/services/audit-log-service.ts
 * 
 * Purpose: Track all sensitive operations for compliance (PSD-12, FIA requirements)
 * Required by: TASK.md SEC-002, PLANNING.md regulatory compliance
 * 
 * Usage:
 *   import { createAuditLog } from '@/lib/services/audit-log-service';
 *   await createAuditLog({
 *     userId: session.userId,
 *     action: 'voucher.issue',
 *     resourceType: 'voucher',
 *     resourceId: voucherId,
 *     metadata: { amount: 1000, programmeId: 'xyz' },
 *     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
 *   });
 */

import { db } from '@/lib/db';
import { auditLogs } from '@/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

function asUuidOrNull(value?: string): string | null {
  if (!value) return null;
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRe.test(value) ? value : null;
}

/**
 * Action types for audit logging (categorized by resource)
 */
export type AuditAction =
  // Auth actions
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_change'
  | 'auth.password_reset_requested'
  | 'auth.password_reset_completed'
  | 'auth.2fa_setup_initiated'
  | 'auth.2fa_enabled'
  | 'auth.2fa_disabled'
  | 'auth.2fa_backup_used'
  | 'auth.2fa_verified'
  // Voucher actions
  | 'voucher.issue'
  | 'voucher.issue_batch'
  | 'voucher.expire'
  | 'voucher.view'
  // Beneficiary actions
  | 'beneficiary.create'
  | 'beneficiary.update'
  | 'beneficiary.suspend'
  | 'beneficiary.reactivate'
  | 'beneficiary.sms_sent'
  // Agent actions
  | 'agent.create'
  | 'agent.update'
  | 'agent.float_adjust'
  | 'agent.suspend'
  | 'agent.reactivate'
  | 'agent.parcel_collected'
  // Float request actions
  | 'float_request.create'
  | 'float_request.approve'
  | 'float_request.reject'
  | 'float_request_created'
  | 'float_request_first_approval'
  | 'float_request_rejected'
  // Duplicate redemption actions
  | 'duplicate_redemption.resolve'
  | 'duplicate_redemption.hide'
  // Advance recovery actions
  | 'advance.manual_recovery'
  | 'advance.automatic_recovery'
  // Reconciliation actions
  | 'reconciliation.adjustment'
  | 'reconciliation.flag_discrepancy'
  // User management actions
  | 'user.create'
  | 'user.update'
  | 'user.role_change'
  | 'user.delete'
  // Role/Permission actions
  | 'role.create'
  | 'role.update'
  | 'role.delete'
  | 'permission.assign'
  | 'permission.revoke'
  // Programme actions
  | 'programme.create'
  | 'programme.update'
  | 'programme.delete'
  // Field ops actions
  | 'field.task_assign'
  | 'field.asset_update'
  | 'field.maintenance_log'
  | 'terminal.assign'
  | 'terminal.status_change'
  // Compliance actions
  | 'compliance.sar_filed'
  | 'compliance.incident_reported'
  // Open Banking actions
  | 'bank.consent_requested'
  | 'bank.token_exchanged';

/**
 * Resource types for audit logging
 */
export type AuditResourceType =
  | 'user'
  | 'beneficiary'
  | 'voucher'
  | 'agent'
  | 'float_request'
  | 'duplicate_redemption'
  | 'reconciliation'
  | 'role'
  | 'permission'
  | 'programme'
  | 'task'
  | 'asset'
  | 'terminal'
  | 'maintenance_log'
  | 'field_asset'
  | 'field_task'
  | 'incident'
  | 'bank_consent'
  | 'parcel';

/**
 * Audit log entry parameters
 */
export interface AuditLogParams {
  /** Portal user ID who performed the action */
  userId: string;
  /** Action performed (e.g., 'voucher.issue', 'beneficiary.suspend') */
  action: AuditAction;
  /** Resource type affected (e.g., 'voucher', 'beneficiary') */
  resourceType: AuditResourceType;
  /** ID of the affected resource (optional, e.g., voucher ID) */
  resourceId?: string;
  /** Additional metadata (JSON, e.g., { amount: 1000, reason: 'fraud' }) */
  metadata?: Record<string, unknown>;
  /** IP address of the request (for security tracking) */
  ipAddress?: string;
  /** User agent string (for device tracking) */
  userAgent?: string;
}

/**
 * Create an audit log entry in the database
 * 
 * @param params - Audit log parameters
 * @returns Promise<void>
 * 
 * @example
 * // Log voucher issuance
 * await createAuditLog({
 *   userId: session.userId,
 *   action: 'voucher.issue',
 *   resourceType: 'voucher',
 *   resourceId: voucherId,
 *   metadata: {
 *     beneficiaryId: 'user-123',
 *     programmeId: 'prog-456',
 *     amount: 1000,
 *     currency: 'NAD',
 *   },
 *   ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
 *   userAgent: request.headers.get('user-agent') || 'unknown',
 * });
 * 
 * @example
 * // Log beneficiary suspension
 * await createAuditLog({
 *   userId: session.userId,
 *   action: 'beneficiary.suspend',
 *   resourceType: 'beneficiary',
 *   resourceId: beneficiaryId,
 *   metadata: {
 *     reason: 'Suspected fraud',
 *     previousStatus: 'active',
 *   },
 *   ipAddress: getIpAddress(request),
 * });
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const {
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    ipAddress,
    userAgent,
  } = params;

  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType: resourceType,
      entityId: asUuidOrNull(resourceId),
      newData: metadata ?? null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    // Optional: Also log to console for development/debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', {
        action,
        resourceType,
        resourceId,
        userId,
        metadata,
      });
    }
  } catch (error) {
    // Audit logging should NOT crash the application
    // Log error but allow the operation to continue
    console.error('[AUDIT LOG ERROR]', error, {
      action,
      resourceType,
      resourceId,
      userId,
    });
    // Optional: Send to error monitoring service (Sentry, etc.)
  }
}

/**
 * Helper: Extract IP address from Next.js request
 * Handles x-forwarded-for, x-real-ip, and direct connection
 */
export function getIpAddress(request: Request): string {
  const headers = request.headers;
  
  // Check for x-forwarded-for (Vercel, load balancers)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated (client, proxy1, proxy2)
    return forwardedFor.split(',')[0].trim();
  }

  // Check for x-real-ip (some proxies)
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback (not available in serverless)
  return 'unknown';
}

/**
 * Helper: Extract user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Helper: Create audit log from Next.js request with session
 * 
 * @example
 * import { getPortalSession } from '@/lib/portal-auth';
 * const session = getPortalSession(request);
 * await createAuditLogFromRequest(request, session, {
 *   action: 'voucher.issue',
 *   resourceType: 'voucher',
 *   resourceId: voucherId,
 *   metadata: { amount: 1000 },
 * });
 */
export async function createAuditLogFromRequest(
  request: Request,
  session: { userId: string } | null,
  params: Omit<AuditLogParams, 'userId' | 'ipAddress' | 'userAgent'>
): Promise<void> {
  if (!session) {
    console.warn('[AUDIT] Cannot create log without session');
    return;
  }

  await createAuditLog({
    userId: session.userId,
    ipAddress: getIpAddress(request),
    userAgent: getUserAgent(request),
    ...params,
  });
}

/**
 * Batch audit logging (for bulk operations)
 * 
 * @example
 * // Log batch voucher issuance
 * await createBatchAuditLogs(
 *   session.userId,
 *   'voucher.issue_batch',
 *   'voucher',
 *   voucherIds.map(id => ({
 *     resourceId: id,
 *     metadata: { programmeId: 'prog-123' },
 *   })),
 *   getIpAddress(request),
 *   getUserAgent(request)
 * );
 */
export async function createBatchAuditLogs(
  userId: string,
  action: AuditAction,
  resourceType: AuditResourceType,
  entries: Array<{ resourceId?: string; metadata?: Record<string, unknown> }>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const values = entries.map((entry) => ({
      userId,
      action,
      entityType: resourceType,
      entityId: asUuidOrNull(entry.resourceId),
      newData: entry.metadata ?? null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    }));

    await db.insert(auditLogs).values(values);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] Batch logged ${entries.length} ${action} operations`);
    }
  } catch (error) {
    console.error('[AUDIT LOG BATCH ERROR]', error, {
      action,
      resourceType,
      count: entries.length,
    });
  }
}

/**
 * Query audit logs (for Ketchup Portal audit page)
 * 
 * @example
 * const logs = await queryAuditLogs({
 *   action: 'voucher.issue',
 *   limit: 50,
 *   offset: 0,
 * });
 */
export interface QueryAuditLogsParams {
  userId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Query audit logs with filters (used by audit page API)
 * Returns logs in reverse chronological order (newest first)
 */
export async function queryAuditLogs(params: QueryAuditLogsParams) {
  const {
    userId,
    action,
    resourceType,
    resourceId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = params;

  const whereConditions = [];
  if (userId) whereConditions.push(eq(auditLogs.userId, userId));
  if (action) whereConditions.push(eq(auditLogs.action, action));
  if (resourceType) whereConditions.push(eq(auditLogs.entityType, resourceType));
  if (resourceId) {
    const parsedId = asUuidOrNull(resourceId);
    if (parsedId) whereConditions.push(eq(auditLogs.entityId, parsedId));
  }
  if (startDate) whereConditions.push(gte(auditLogs.createdAt, startDate));
  if (endDate) whereConditions.push(lte(auditLogs.createdAt, endDate));

  const logs = await db
    .select()
    .from(auditLogs)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return logs;
}

/**
 * Export audit logs as CSV (for compliance reporting)
 * 
 * @example
 * const csv = await exportAuditLogsAsCsv({
 *   startDate: new Date('2026-01-01'),
 *   endDate: new Date('2026-03-31'),
 * });
 * 
 * // Return as downloadable CSV
 * return new Response(csv, {
 *   headers: {
 *     'Content-Type': 'text/csv',
 *     'Content-Disposition': 'attachment; filename=audit-logs.csv',
 *   },
 * });
 */
export async function exportAuditLogsAsCsv(params: QueryAuditLogsParams): Promise<string> {
  const logs = await queryAuditLogs({ ...params, limit: 10000 }); // Max 10K rows for CSV

  // CSV header
  const header = 'Timestamp,User ID,Action,Resource Type,Resource ID,Metadata,IP Address,User Agent\n';

  // CSV rows
  const rows = logs
    .map((log) => {
      const timestamp = log.createdAt.toISOString();
      const metadata = log.newData ? JSON.stringify(log.newData) : '';
      const ipAddress = log.ipAddress || '';
      const userAgent = log.userAgent || '';
      const resourceId = log.entityId || '';

      // Escape commas and quotes in CSV
      const escapeCsv = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      return [
        timestamp,
        log.userId,
        log.action,
        log.entityType || '',
        resourceId,
        escapeCsv(metadata),
        ipAddress,
        escapeCsv(userAgent),
      ].join(',');
    })
    .join('\n');

  return header + rows;
}
