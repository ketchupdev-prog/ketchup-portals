/**
 * KRI Export Utilities – CSV, PDF, and XML export for BoN submission
 * Location: src/lib/export/kri-export.ts
 * Used by: KRI Dashboard export buttons
 */

import type { KRIMetrics } from '@/lib/types/compliance';

export function exportKRIToCSV(data: KRIMetrics): string {
  const headers = ['KRI ID', 'Name', 'Current Value', 'Target', 'Unit', 'Status', 'Last Updated'];
  const rows = Object.values(data).map((metric) => [
    metric.id,
    metric.name,
    metric.current,
    metric.target,
    metric.unit,
    metric.status,
    metric.lastUpdated,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportKRIToXML(data: KRIMetrics): string {
  const metrics = Object.values(data);

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<BonComplianceReport>
  <ReportType>KRI</ReportType>
  <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
  <Institution>Ketchup SmartPay</Institution>
  <Metrics>
${metrics
  .map(
    (metric) => `    <Metric>
      <ID>${metric.id}</ID>
      <Name>${metric.name}</Name>
      <CurrentValue>${metric.current}</CurrentValue>
      <Target>${metric.target}</Target>
      <Unit>${metric.unit}</Unit>
      <Status>${metric.status}</Status>
      <DataSource>${metric.dataSource}</DataSource>
      <LastUpdated>${metric.lastUpdated}</LastUpdated>
    </Metric>`
  )
  .join('\n')}
  </Metrics>
</BonComplianceReport>`;

  return xmlContent;
}

export function downloadXML(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportKRIToPDFData(data: KRIMetrics) {
  return {
    title: 'Key Risk Indicators Report',
    generatedAt: new Date().toISOString(),
    institution: 'Ketchup SmartPay',
    metrics: Object.values(data),
  };
}
