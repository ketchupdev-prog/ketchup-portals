/**
 * Programme Performance Report PDF Generator
 * Location: src/lib/pdf/programme-report.tsx
 * 
 * Purpose: Generate PDF reports showing programme performance metrics
 * Used by: POST /api/v1/reports/programme-performance
 * 
 * Report Structure:
 * - Header with Ketchup logo and report title
 * - Programme Summary (budget, disbursed, beneficiaries, vouchers)
 * - Regional Breakdown (table with region-wise metrics)
 * - Voucher Statistics (issued vs redeemed, redemption rate)
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
  PDFSummaryBox,
  pdfStyles,
} from './components';

/**
 * Programme Performance Report Data Structure
 */
export interface ProgrammeReportData {
  programme: {
    id: string;
    name: string;
    description: string | null;
    allocated_budget: string | null;
    spent_to_date: string | null;
    start_date: string;
    end_date: string;
  };
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_budget: string;
    disbursed: string;
    remaining: string;
    disbursement_percentage: number;
    total_beneficiaries: number;
    vouchers_issued: number;
    vouchers_redeemed: number;
    redemption_rate: number;
  };
  regional_breakdown: Array<{
    region: string;
    budget_allocated: string;
    disbursed: string;
    beneficiaries: number;
    vouchers_issued: number;
    redemption_rate: number;
  }>;
  voucher_statistics: {
    available: number;
    redeemed: number;
    expired: number;
    total: number;
  };
}

/**
 * Format currency (NAD)
 */
function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'N$ 0.00';
  
  // Format large numbers with K/M suffix
  if (num >= 1_000_000) {
    return `N$ ${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `N$ ${(num / 1_000).toFixed(1)}K`;
  }
  return `N$ ${num.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format date
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
 * Programme Performance Report Document
 */
interface ProgrammeReportDocumentProps {
  data: ProgrammeReportData;
  generatedAt: string;
}

export function ProgrammeReportDocument({ data, generatedAt }: ProgrammeReportDocumentProps) {
  const { programme, period, summary, regional_breakdown, voucher_statistics } = data;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <PDFHeader
          title="Programme Performance Report"
          subtitle={programme.name}
          generatedAt={formatDate(generatedAt)}
        />

        {/* Programme Summary */}
        <PDFSummaryBox
          title="Programme Summary"
          rows={[
            { label: 'Programme', value: programme.name },
            { label: 'Period', value: `${formatDate(period.start_date)} - ${formatDate(period.end_date)}` },
            { label: 'Total Budget', value: formatCurrency(summary.total_budget) },
            { label: 'Disbursed', value: `${formatCurrency(summary.disbursed)} (${formatPercentage(summary.disbursement_percentage)})` },
            { label: 'Remaining', value: formatCurrency(summary.remaining) },
            { label: 'Beneficiaries', value: summary.total_beneficiaries.toLocaleString() },
            { label: 'Vouchers Issued', value: summary.vouchers_issued.toLocaleString() },
            { label: 'Redemption Rate', value: formatPercentage(summary.redemption_rate) },
          ]}
        />

        {/* Regional Breakdown */}
        <PDFSection title="Regional Breakdown">
          <PDFTable
            columns={[
              { header: 'Region', key: 'region', width: 2 },
              { header: 'Budget', key: 'budget_allocated', width: 1.5 },
              { header: 'Disbursed', key: 'disbursed', width: 1.5 },
              { header: 'Beneficiaries', key: 'beneficiaries', width: 1.5 },
              { header: 'Vouchers', key: 'vouchers_issued', width: 1.5 },
              { header: 'Redemption', key: 'redemption_rate', width: 1.5 },
            ]}
            data={regional_breakdown.map((region) => ({
              region: region.region || 'Unknown',
              budget_allocated: formatCurrency(region.budget_allocated),
              disbursed: formatCurrency(region.disbursed),
              beneficiaries: region.beneficiaries.toLocaleString(),
              vouchers_issued: region.vouchers_issued.toLocaleString(),
              redemption_rate: formatPercentage(region.redemption_rate),
            }))}
          />
        </PDFSection>

        {/* Voucher Statistics */}
        <PDFSection title="Voucher Status Distribution">
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#10B981' }}>
                {voucher_statistics.redeemed.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Redeemed</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F59E0B' }}>
                {voucher_statistics.available.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Available</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#EF4444' }}>
                {voucher_statistics.expired.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Expired</Text>
            </View>
          </View>
        </PDFSection>

        {/* Footer */}
        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
}

/**
 * Generate Programme Performance Report PDF Buffer
 * 
 * Usage:
 * ```typescript
 * import { renderToBuffer } from '@react-pdf/renderer';
 * const pdfBuffer = await renderToBuffer(<ProgrammeReportDocument data={data} generatedAt={new Date().toISOString()} />);
 * ```
 */
export async function generateProgrammeReportPDF(data: ProgrammeReportData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const generatedAt = new Date().toISOString();
  return renderToBuffer(<ProgrammeReportDocument data={data} generatedAt={generatedAt} />);
}
