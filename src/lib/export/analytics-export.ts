/**
 * Analytics Export Utilities
 * Location: src/lib/export/analytics-export.ts
 */

interface SLAReportData {
  month: string;
  currentUptime: number;
  target: number;
  compliant: boolean;
  components: Array<{
    component: string;
    uptime30d: number;
    status: string;
  }>;
  incidents: Array<{
    timestamp: string;
    component: string;
    duration: number;
    description: string;
  }>;
}

export async function generateSLAReportPDF(data: SLAReportData): Promise<Blob> {
  // For now, return a placeholder implementation
  // In production, this would use @react-pdf/renderer properly in a .tsx file
  const content = `
Monthly SLA Compliance Report

Period: ${data.month}
Generated: ${new Date().toLocaleDateString()}

Executive Summary:
- Current Uptime: ${(data.currentUptime * 100).toFixed(2)}%
- Target SLA: ${(data.target * 100).toFixed(1)}%
- Compliance Status: ${data.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}

Component Uptime (30 Days):
${data.components.map(c => `- ${c.component}: ${c.uptime30d.toFixed(2)}%`).join('\n')}

Incident Summary:
${data.incidents.map(i => `- ${new Date(i.timestamp).toLocaleDateString()}: ${i.component} (${i.duration} min)`).join('\n')}
`;
  
  return new Blob([content], { type: 'text/plain' });
}

export function exportToCSV(
  data: Array<Record<string, string | number>>,
  filename: string
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

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

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
