/**
 * PDF Export Utilities for Financial Reports
 * Uses @react-pdf/renderer for generating compliance reports
 * 
 * Note: This file contains TypeScript types and helper functions.
 * The actual PDF rendering components should be created in a .tsx file when needed.
 */

import type { ReconciliationHistory } from './api/financial';

export interface ReconciliationReportData {
  date: string;
  history: ReconciliationHistory[];
  summary: {
    totalDays: number;
    passedDays: number;
    warningDays: number;
    criticalDays: number;
  };
}

/**
 * For actual PDF generation, create a React component using @react-pdf/renderer:
 * 
 * Example:
 * ```tsx
 * import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
 * import { pdf } from '@react-pdf/renderer';
 * 
 * const styles = StyleSheet.create({
 *   page: { padding: 30 },
 *   // ... other styles
 * });
 * 
 * export const ReconciliationReport = ({ data }: { data: ReconciliationReportData }) => (
 *   <Document>
 *     <Page size="A4" style={styles.page}>
 *       // ... PDF content
 *     </Page>
 *   </Document>
 * );
 * 
 * // Generate PDF
 * const blob = await pdf(<ReconciliationReport data={data} />).toBlob();
 * ```
 */

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadPDF(blob, filename);
}

export function generateCSV(data: any[], columns: string[]): string {
  const header = columns.join(',');
  const rows = data.map((row) => columns.map((col) => `"${row[col] || ''}"`).join(','));
  return [header, ...rows].join('\n');
}
