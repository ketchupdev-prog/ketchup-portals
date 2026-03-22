'use client';

/**
 * Uptime Monitoring – 99.9% SLA tracking (PSD-12 §10)
 */

import { useAnalyticsPolling } from '@/lib/hooks/use-analytics-polling';
import { getUptimeMetrics, generateSLAReport } from '@/lib/api/analytics';
import { MetricCard, StatusBadge } from '@/components/analytics';
import { TrendChart } from '@/components/financial/trend-chart';
import { useState } from 'react';

export default function UptimeMonitoringPage() {
  const [generatingReport, setGeneratingReport] = useState(false);
  
  const { data, loading, error, refetch } = useAnalyticsPolling(
    getUptimeMetrics,
    { interval: 60000, enabled: true }
  );

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const month = new Date().toISOString().slice(0, 7);
      const blob = await generateSLAReport(month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SLA-Report-${month}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate SLA report:', err);
      alert('Failed to generate SLA report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading uptime metrics: {error.message}</span>
        <button onClick={refetch} className="btn btn-sm">Retry</button>
      </div>
    );
  }

  const slaTarget = 99.9;
  const currentUptime = (data?.currentUptime || 0) * 100;
  const isCompliant = currentUptime >= slaTarget;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Uptime Monitoring</h1>
          <p className="text-sm text-content-muted mt-1">99.9% SLA tracking (PSD-12 §10)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleGenerateReport} 
            className="btn btn-sm btn-primary"
            disabled={generatingReport}
          >
            {generatingReport ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Generating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate SLA Report
              </>
            )}
          </button>
          <button onClick={refetch} className="btn btn-sm btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">System Status: {loading ? '...' : data?.currentStatus.toUpperCase()}</h2>
                {!loading && (
                  data?.currentStatus === 'online' ? (
                    <span className="text-success text-2xl">✓</span>
                  ) : data?.currentStatus === 'degraded' ? (
                    <span className="text-warning text-2xl">⚠</span>
                  ) : (
                    <span className="text-error text-2xl">✗</span>
                  )
                )}
              </div>
              <div className="space-y-1 text-sm">
                <p>Current Uptime: <span className="font-bold">{loading ? '...' : `${currentUptime.toFixed(2)}%`}</span> (Last 30 days)</p>
                <p>Target: <span className="font-bold">{slaTarget}%</span> (PSD-12 §10 requirement)</p>
                <p>Status: <span className={`font-bold ${isCompliant ? 'text-success' : 'text-error'}`}>
                  {loading ? '...' : isCompliant ? 'COMPLIANT ✓' : 'NON-COMPLIANT ✗'}
                </span></p>
              </div>
              {!loading && data?.lastIncident && (
                <p className="text-sm text-content-muted mt-2">
                  Last Incident: {new Date(data.lastIncident.timestamp).toLocaleString()} ({data.lastIncident.reason}) - {data.lastIncident.duration} min
                </p>
              )}
              {!loading && data?.nextMaintenance && (
                <p className="text-sm text-content-muted">
                  Next Maintenance: Scheduled for {new Date(data.nextMaintenance.scheduled).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Component Status</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Status</th>
                  <th>Uptime (24h)</th>
                  <th>Uptime (7d)</th>
                  <th>Uptime (30d)</th>
                  <th>Last Check</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><div className="skeleton h-12 w-full"></div></td></tr>
                ) : (
                  (data?.components || []).map((component) => {
                    let statusIcon = '🟢';
                    if (component.uptime30d < 99.0) statusIcon = '🔴';
                    else if (component.uptime30d < 99.9) statusIcon = '🟡';
                    
                    return (
                      <tr key={component.component}>
                        <td className="font-semibold">{component.component}</td>
                        <td>
                          <StatusBadge status={component.status} />
                        </td>
                        <td>{component.uptime24h.toFixed(2)}%</td>
                        <td>{component.uptime7d.toFixed(2)}%</td>
                        <td>
                          <span className="flex items-center gap-1">
                            {statusIcon} {component.uptime30d.toFixed(2)}%
                          </span>
                        </td>
                        <td className="text-sm text-content-muted">{component.lastCheck}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Health Check History (30 Days)</h2>
          {loading ? (
            <div className="skeleton h-64 w-full"></div>
          ) : (
            <TrendChart
              data={(data?.healthCheckHistory || []).map(item => ({
                date: new Date(item.timestamp).toLocaleDateString(),
                value: item.uptime * 100,
              }))}
              yAxisLabel="Uptime (%)"
              color="#10b981"
              height={250}
            />
          )}
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Incident Timeline</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Component</th>
                  <th>Duration</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}><div className="skeleton h-12 w-full"></div></td></tr>
                ) : (data?.incidents || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-content-muted">
                      No incidents in the last 30 days
                    </td>
                  </tr>
                ) : (
                  (data?.incidents || []).map((incident) => (
                    <tr key={incident.id}>
                      <td>{new Date(incident.timestamp).toLocaleString()}</td>
                      <td>{incident.component}</td>
                      <td>{incident.duration} minutes</td>
                      <td>{incident.description}</td>
                      <td><StatusBadge status={incident.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
