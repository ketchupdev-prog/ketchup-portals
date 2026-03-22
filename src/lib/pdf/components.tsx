/**
 * Reusable PDF Components for React-PDF
 * Location: src/lib/pdf/components.tsx
 * 
 * Purpose: DRY components for consistent PDF styling across all reports
 * Used by: programme-report.tsx, audit-report.tsx
 * 
 * Components:
 * - PDFHeader: Report header with Ketchup logo and title
 * - PDFFooter: Page footer with page numbers and branding
 * - PDFTable: Styled table component with alternating row colors
 * - PDFSection: Section wrapper with title
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

/**
 * Ketchup Brand Colors (matching DaisyUI theme)
 */
const COLORS = {
  primary: '#FF5733', // Ketchup red
  secondary: '#FF8C42', // Ketchup orange
  text: '#1F2937', // Dark gray
  textLight: '#6B7280', // Medium gray
  border: '#E5E7EB', // Light gray border
  background: '#F9FAFB', // Very light gray background
  white: '#FFFFFF',
};

/**
 * PDF Styles
 */
export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 3,
  },
  headerRight: {
    textAlign: 'right',
  },
  generatedText: {
    fontSize: 9,
    color: COLORS.textLight,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textLight,
  },
  pageNumber: {
    fontSize: 8,
    color: COLORS.textLight,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    flex: 1,
  },
  summaryBox: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.text,
  },
  filterText: {
    fontSize: 9,
    color: COLORS.text,
    marginBottom: 2,
  },
});

/**
 * PDF Header Component
 */
interface PDFHeaderProps {
  title: string;
  subtitle?: string;
  generatedAt: string;
}

export function PDFHeader({ title, subtitle, generatedAt }: PDFHeaderProps) {
  return (
    <View style={pdfStyles.header}>
      <View style={pdfStyles.headerLeft}>
        <Text style={pdfStyles.logo}>🍅</Text>
        <View>
          <Text style={pdfStyles.headerTitle}>{title}</Text>
          {subtitle && <Text style={pdfStyles.headerSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={pdfStyles.headerRight}>
        <Text style={pdfStyles.generatedText}>Generated: {generatedAt}</Text>
      </View>
    </View>
  );
}

/**
 * PDF Footer Component
 */
interface PDFFooterProps {
  pageNumber: number;
  totalPages: number;
}

export function PDFFooter({ pageNumber, totalPages }: PDFFooterProps) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>Ketchup SmartPay Portal</Text>
      <Text style={pdfStyles.pageNumber}>
        Page {pageNumber} of {totalPages}
      </Text>
    </View>
  );
}

/**
 * PDF Section Component
 */
interface PDFSectionProps {
  title: string;
  children: React.ReactNode;
}

export function PDFSection({ title, children }: PDFSectionProps) {
  return (
    <View style={pdfStyles.section}>
      <Text style={pdfStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * PDF Table Component
 */
interface PDFTableColumn {
  header: string;
  key: string;
  width?: number;
}

interface PDFTableProps {
  columns: PDFTableColumn[];
  data: Record<string, any>[];
}

export function PDFTable({ columns, data }: PDFTableProps) {
  return (
    <View style={pdfStyles.table}>
      {/* Table Header */}
      <View style={pdfStyles.tableHeader}>
        {columns.map((col, idx) => (
          <Text
            key={idx}
            style={[
              pdfStyles.tableCellHeader,
              col.width ? { flex: col.width } : {},
            ]}
          >
            {col.header}
          </Text>
        ))}
      </View>

      {/* Table Rows */}
      {data.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={rowIdx % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}
        >
          {columns.map((col, colIdx) => (
            <Text
              key={colIdx}
              style={[
                pdfStyles.tableCell,
                col.width ? { flex: col.width } : {},
              ]}
            >
              {row[col.key] ?? '—'}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * PDF Summary Box Component
 */
interface PDFSummaryBoxProps {
  title: string;
  rows: Array<{ label: string; value: string }>;
}

export function PDFSummaryBox({ title, rows }: PDFSummaryBoxProps) {
  return (
    <View style={pdfStyles.summaryBox}>
      <Text style={pdfStyles.summaryTitle}>{title}</Text>
      {rows.map((row, idx) => (
        <View key={idx} style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>{row.label}</Text>
          <Text style={pdfStyles.summaryValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * PDF Filter Box Component
 */
interface PDFFilterBoxProps {
  title: string;
  filters: string[];
}

export function PDFFilterBox({ title, filters }: PDFFilterBoxProps) {
  return (
    <View style={pdfStyles.filterBox}>
      <Text style={pdfStyles.filterTitle}>{title}</Text>
      {filters.map((filter, idx) => (
        <Text key={idx} style={pdfStyles.filterText}>
          • {filter}
        </Text>
      ))}
    </View>
  );
}
