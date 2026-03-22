/**
 * Audit Log Export Report PDF Generator
 * Location: src/lib/pdf/audit-report.tsx
 * 
 * Purpose: Generate PDF reports exporting audit logs with filters
 * Used by: POST /api/v1/reports/audit-export
 * 
 * Report Structure:
 * - Header with Ketchup logo and report title
 * - Filters Applied (date range, user, action)
 * - Audit Log Entries (table with date/time, user, action, resource, IP)
 * - Footer with page numbers and branding
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
} from '@react-pdf/renderer';
import {
  PDFHeader,
  PDFFooter,
  PDFSection,
  PDFTable,
  PDFFilterBox,
  pdfStyles,
} from './components';

/**
 * Audit Log Export Report Data Structure
 */
export interface AuditReportData {
  filters: {
    start_date: string;
    end_date: string;
    user_email?: string;
    action?: string;
  };
  logs: Array<{
    id: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    ip_address: string | null;
    created_at: string;
    metadata?: Record<string, any> | null;
  }>;
  total_records: number;
}

/**
 * Format date and time
 */
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format date only
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate text to fit in table cell
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Chunk array into pages (max 25 rows per page)
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Audit Log Export Report Document (Single Page)
 */
interface AuditReportPageProps {
  data: AuditReportData;
  logs: AuditReportData['logs'];
  generatedAt: string;
  pageNumber: number;
  totalPages: number;
  isFirstPage: boolean;
}

function AuditReportPage({
  data,
  logs,
  generatedAt,
  pageNumber,
  totalPages,
  isFirstPage,
}: AuditReportPageProps) {
  const { filters } = data;

  return (
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <PDFHeader
        title="Audit Log Export"
        subtitle={`${data.total_records.toLocaleString()} record${data.total_records !== 1 ? 's' : ''}`}
        generatedAt={formatDate(generatedAt)}
      />

      {/* Filters Applied (only on first page) */}
      {isFirstPage && (
        <PDFFilterBox
          title="Filters Applied"
          filters={[
            `Date Range: ${formatDate(filters.start_date)} - ${formatDate(filters.end_date)}`,
            filters.user_email
              ? `User: ${filters.user_email}`
              : 'User: All Users',
            filters.action ? `Action: ${filters.action}` : 'Action: All Actions',
            `Total Records: ${data.total_records.toLocaleString()}`,
          ]}
        />
      )}

      {/* Audit Log Entries */}
      <PDFSection title={isFirstPage ? 'Audit Log Entries' : 'Audit Log Entries (continued)'}>
        <PDFTable
          columns={[
            { header: 'Date/Time', key: 'datetime', width: 2 },
            { header: 'User', key: 'user_email', width: 2.5 },
            { header: 'Action', key: 'action', width: 2 },
            { header: 'Resource', key: 'resource', width: 2 },
            { header: 'IP Address', key: 'ip_address', width: 2 },
          ]}
          data={logs.map((log) => ({
            datetime: formatDateTime(log.created_at),
            user_email: truncate(log.user_email, 25),
            action: truncate(log.action, 20),
            resource: log.resource_id
              ? truncate(`${log.resource_type}:${log.resource_id.substring(0, 8)}`, 20)
              : truncate(log.resource_type, 20),
            ip_address: log.ip_address ? truncate(log.ip_address, 15) : '—',
          }))}
        />
      </PDFSection>

      {/* Footer */}
      <PDFFooter pageNumber={pageNumber} totalPages={totalPages} />
    </Page>
  );
}

/**
 * Audit Log Export Report Document (Multi-Page)
 */
interface AuditReportDocumentProps {
  data: AuditReportData;
  generatedAt: string;
}

export function AuditReportDocument({ data, generatedAt }: AuditReportDocumentProps) {
  const ROWS_PER_PAGE = 25;
  const logChunks = chunkArray(data.logs, ROWS_PER_PAGE);
  const totalPages = logChunks.length || 1;

  return (
    <Document>
      {logChunks.length === 0 ? (
        // Empty report (no logs found)
        <Page size="A4" style={pdfStyles.page}>
          <PDFHeader
            title="Audit Log Export"
            subtitle="No records found"
            generatedAt={formatDate(generatedAt)}
          />
          <PDFFilterBox
            title="Filters Applied"
            filters={[
              `Date Range: ${formatDate(data.filters.start_date)} - ${formatDate(data.filters.end_date)}`,
              data.filters.user_email
                ? `User: ${data.filters.user_email}`
                : 'User: All Users',
              data.filters.action ? `Action: ${data.filters.action}` : 'Action: All Actions',
              'Total Records: 0',
            ]}
          />
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>
              No audit logs found matching the specified filters.
            </Text>
          </View>
          <PDFFooter pageNumber={1} totalPages={1} />
        </Page>
      ) : (
        // Render pages with logs
        logChunks.map((logs, index) => (
          <AuditReportPage
            key={index}
            data={data}
            logs={logs}
            generatedAt={generatedAt}
            pageNumber={index + 1}
            totalPages={totalPages}
            isFirstPage={index === 0}
          />
        ))
      )}
    </Document>
  );
}

/**
 * Generate Audit Log Export Report PDF Buffer
 * 
 * Usage:
 * ```typescript
 * import { renderToBuffer } from '@react-pdf/renderer';
 * const pdfBuffer = await renderToBuffer(<AuditReportDocument data={data} generatedAt={new Date().toISOString()} />);
 * ```
 */
export async function generateAuditReportPDF(data: AuditReportData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const generatedAt = new Date().toISOString();
  return renderToBuffer(<AuditReportDocument data={data} generatedAt={generatedAt} />);
}
