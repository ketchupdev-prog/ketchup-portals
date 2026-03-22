'use client';

import { useEffect, useState } from 'react';
import { KRICard } from '@/components/admin/kri-card';
import { AlertBanner } from '@/components/admin/alert-banner';
import { getKRIMetrics } from '@/lib/api/compliance';
import { exportKRIToCSV, exportKRIToXML, downloadCSV, downloadXML } from '@/lib/export/kri-export';
import { pdf } from '@react-pdf/renderer';
import { KRIPDFDocument } from '@/lib/export/kri-pdf';
import type { KRIMetrics, KRIMetric } from '@/lib/types/compliance';

export default function KRIDashboardPage() {
  const [metrics, setMetrics] = useState<KRIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<KRIMetric | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchMetrics = async () => {
    const response = await getKRIMetrics();
    if (response.success && response.data) {
      setMetrics(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch KRI metrics');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = async (format: 'CSV' | 'PDF' | 'XML') => {
    if (!metrics) return;

    setExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `KRI_Report_${timestamp}`;

      switch (format) {
        case 'CSV': {
          const csv = exportKRIToCSV(metrics);
          downloadCSV(csv, `${filename}.csv`);
          break;
        }
        case 'XML': {
          const xml = exportKRIToXML(metrics);
          downloadXML(xml, `${filename}.xml`);
          break;
        }
        case 'PDF': {
          const doc = <KRIPDFDocument data={metrics} generatedAt={new Date().toISOString()} />;
          const blob = await pdf(doc).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          break;
        }
      }
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const criticalCount = metrics ? Object.values(metrics).filter((m) => m.status === 'CRITICAL').length : 0;
  const warningCount = metrics ? Object.values(metrics).filter((m) => m.status === 'WARNING').length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Key Risk Indicators</h1>
          <p className="text-sm text-content-muted mt-1">12 KRIs as per PSD-12 Annex B</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => handleExport('CSV')}
            disabled={exporting || !metrics}
          >
            Export CSV
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => handleExport('XML')}
            disabled={exporting || !metrics}
          >
            Export XML
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleExport('PDF')}
            disabled={exporting || !metrics}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {error && (
        <AlertBanner
          type="error"
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {criticalCount > 0 && (
        <AlertBanner
          type="error"
          title="Critical KRI Breach"
          message={`${criticalCount} KRI${criticalCount > 1 ? 's are' : ' is'} in critical state. Immediate action required.`}
        />
      )}

      {warningCount > 0 && (
        <AlertBanner
          type="warning"
          title="KRI Warning"
          message={`${warningCount} KRI${warningCount > 1 ? 's are' : ' is'} approaching threshold. Monitor closely.`}
        />
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.values(metrics).map((metric) => (
              <KRICard
                key={metric.id}
                metric={metric}
                onClick={() => setSelectedMetric(metric)}
              />
            ))}
          </div>

          {selectedMetric && (
            <dialog className="modal modal-open">
              <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg">{selectedMetric.name}</h3>
                <p className="py-4 text-sm text-content-muted">{selectedMetric.description}</p>
                
                <div className="space-y-4">
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">Current Value</div>
                      <div className="stat-value text-primary">
                        {selectedMetric.current}
                        {selectedMetric.unit}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Target</div>
                      <div className="stat-value text-secondary">
                        {selectedMetric.target}
                        {selectedMetric.unit}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Data Source</p>
                      <p className="text-sm text-content-muted">{selectedMetric.dataSource}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-content-muted">
                        {new Date(selectedMetric.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">7-Day Trend</p>
                    <div className="overflow-x-auto">
                      <table className="table table-xs">
                        <thead>
                          <tr>
                            <th>Day</th>
                            {selectedMetric.trend.map((_, idx) => (
                              <th key={idx}>D-{selectedMetric.trend.length - idx}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Value</td>
                            {selectedMetric.trend.map((value, idx) => (
                              <td key={idx}>
                                {value}
                                {selectedMetric.unit}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="modal-action">
                  <button className="btn" onClick={() => setSelectedMetric(null)}>
                    Close
                  </button>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop" onClick={() => setSelectedMetric(null)}>
                <button>close</button>
              </form>
            </dialog>
          )}
        </>
      )}
    </div>
  );
}
