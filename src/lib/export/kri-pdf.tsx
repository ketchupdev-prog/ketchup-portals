/**
 * KRI PDF Export – Generate PDF report for BoN quarterly submission
 * Location: src/lib/export/kri-pdf.tsx
 * Used by: KRI Dashboard export button (PDF format)
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { KRIMetrics } from '@/lib/types/compliance';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#bfbfbf',
  },
  col1: { width: '5%' },
  col2: { width: '30%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '10%' },
  col6: { width: '15%' },
  col7: { width: '10%' },
  statusGood: { color: '#10b981' },
  statusWarning: { color: '#f59e0b' },
  statusCritical: { color: '#ef4444' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

interface KRIPDFDocumentProps {
  data: KRIMetrics;
  generatedAt: string;
}

export function KRIPDFDocument({ data, generatedAt }: KRIPDFDocumentProps) {
  const metrics = Object.values(data);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Key Risk Indicators Report</Text>
          <Text style={styles.subtitle}>Bank of Namibia Compliance Report - PSD-12 Annex B</Text>
          <Text style={styles.subtitle}>Institution: Ketchup SmartPay</Text>
          <Text style={styles.subtitle}>Generated: {new Date(generatedAt).toLocaleString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text>
            This report presents 12 Key Risk Indicators as required by PSD-12 Annex B.{'\n'}
            Total Metrics: {metrics.length}{'\n'}
            Good: {metrics.filter((m) => m.status === 'GOOD').length}{'\n'}
            Warning: {metrics.filter((m) => m.status === 'WARNING').length}{'\n'}
            Critical: {metrics.filter((m) => m.status === 'CRITICAL').length}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KRI Metrics</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.col1]}>ID</Text>
              <Text style={[styles.tableCell, styles.col2]}>Name</Text>
              <Text style={[styles.tableCell, styles.col3]}>Current</Text>
              <Text style={[styles.tableCell, styles.col4]}>Target</Text>
              <Text style={[styles.tableCell, styles.col5]}>Unit</Text>
              <Text style={[styles.tableCell, styles.col6]}>Status</Text>
              <Text style={[styles.tableCell, styles.col7]}>Updated</Text>
            </View>
            {metrics.map((metric) => (
              <View key={metric.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{metric.id}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{metric.name}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{metric.current}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{metric.target}</Text>
                <Text style={[styles.tableCell, styles.col5]}>{metric.unit}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.col6,
                    metric.status === 'GOOD'
                      ? styles.statusGood
                      : metric.status === 'WARNING'
                        ? styles.statusWarning
                        : styles.statusCritical,
                  ]}
                >
                  {metric.status}
                </Text>
                <Text style={[styles.tableCell, styles.col7]}>
                  {new Date(metric.lastUpdated).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          Ketchup SmartPay - Compliance Reporting System{'\n'}
          This document is confidential and intended for Bank of Namibia review only.
        </Text>
      </Page>
    </Document>
  );
}
