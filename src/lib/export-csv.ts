/**
 * Shared CSV export utility for Ketchup Portals.
 * Single source of truth for CSV generation and download.
 * DRY refactoring – eliminates duplicate exportCSV implementations.
 */

export interface CSVExportColumn<T> {
  key: keyof T;
  header: string;
}

/**
 * Export data to CSV file and trigger browser download.
 * @param data - Array of objects to export
 * @param columns - Array of column definitions with key and header
 * @param filename - Name of the downloaded CSV file (e.g., 'vouchers-2026-03-18.csv')
 */
export function exportToCSV<T extends object>(
  data: T[],
  columns: CSVExportColumn<T>[],
  filename: string
): void {
  const header = columns.map((col) => col.header).join(',');
  const body = data
    .map((row) =>
      columns
        .map((col) => {
          const value = row[col.key];
          const stringValue = String(value ?? '');
          // Escape commas and quotes in CSV values
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    )
    .join('\n');

  const csvContent = header + '\n' + body;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate timestamp for CSV filenames in format YYYY-MM-DD.
 * Example: '2026-03-18'
 */
export function getCSVTimestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Build CSV filename with timestamp.
 * Example: buildCSVFilename('vouchers') => 'vouchers-2026-03-18.csv'
 */
export function buildCSVFilename(prefix: string): string {
  return `${prefix}-${getCSVTimestamp()}.csv`;
}
