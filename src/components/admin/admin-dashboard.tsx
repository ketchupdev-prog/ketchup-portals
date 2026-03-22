'use client';

/**
 * Admin Dashboard Overview Component
 * Displays system health, compliance, financial, security metrics and alerts
 */

import { StatsCard } from './stats-card';
import { AlertBanner } from './alert-banner';
import { StatusIndicator } from './status-indicator';
import { RefreshButton } from './refresh-button';

export function AdminDashboard() {
  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Dashboard refreshed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Admin Dashboard</h1>
          <p className="text-sm text-content-muted mt-1">SmartPay Operations Management</p>
        </div>
        <RefreshButton onRefresh={handleRefresh} label="Refresh" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="System Health"
          value="94%"
          variant="success"
          badge={<StatusIndicator status="good" />}
        />
        <StatsCard
          title="Compliance Status"
          value="95%"
          variant="success"
          subtitle="PSD-12 Compliance"
          badge={<StatusIndicator status="good" />}
        />
        <StatsCard
          title="Financial Health"
          value="98%"
          variant="success"
          subtitle="Trust Account Status"
          badge={<StatusIndicator status="good" />}
        />
        <StatsCard
          title="Security Score"
          value="96%"
          variant="success"
          badge={<StatusIndicator status="good" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard
          title="Uptime (24h)"
          value="99.91%"
          variant="success"
          subtitle="Above 99.9% SLA"
          badge={<StatusIndicator status="good" label="✓ Above SLA" />}
        />
        <StatsCard
          title="Uptime (7d)"
          value="99.95%"
          variant="success"
          subtitle="Above 99.9% SLA"
          badge={<StatusIndicator status="good" label="✓ Above SLA" />}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-base-content">Active Alerts</h2>
        
        <AlertBanner
          type="error"
          title="Critical: 3 Alerts"
          message="Multiple failed authentication attempts detected from suspicious IPs"
          action={<button className="btn btn-sm btn-primary">Investigate</button>}
        />
        
        <AlertBanner
          type="warning"
          title="Warning: 5 Alerts"
          message="BoN reporting deadline approaching - 2 reports pending submission"
          action={<button className="btn btn-sm btn-warning">Review</button>}
        />
        
        <AlertBanner
          type="info"
          message="System maintenance scheduled for 2026-03-25 02:00 UTC"
          dismissible
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Transaction Volume (24h)</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">3,456</p>
                  <p className="text-xs text-content-muted">Transactions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">N$1.2M</p>
                  <p className="text-xs text-content-muted">Volume</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">N$347</p>
                  <p className="text-xs text-content-muted">Avg Value</p>
                </div>
              </div>
              <div className="h-40 flex items-center justify-center bg-base-100 rounded-lg">
                <p className="text-sm text-content-muted">Chart placeholder - will be integrated by Agent 7</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Recent Critical Events</h2>
            <div className="space-y-2">
              {[
                {
                  time: '09:45',
                  event: 'Suspicious login blocked',
                  severity: 'error' as const,
                },
                {
                  time: '09:32',
                  event: 'Trust account reconciled',
                  severity: 'success' as const,
                },
                {
                  time: '09:15',
                  event: 'BoN report submission due',
                  severity: 'warning' as const,
                },
                {
                  time: '08:47',
                  event: 'ML model updated (Fraud v2.3.1)',
                  severity: 'info' as const,
                },
              ].map((event, i) => (
                <div key={i} className={`alert alert-${event.severity} py-2`}>
                  <span className="text-xs font-mono">{event.time}</span>
                  <span className="text-sm">{event.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-base-100 rounded-lg">
              <p className="text-sm text-content-muted">Active Users</p>
              <p className="text-2xl font-bold mt-1">1,234</p>
              <p className="text-xs text-success mt-1">+5%</p>
            </div>
            <div className="text-center p-4 bg-base-100 rounded-lg">
              <p className="text-sm text-content-muted">API Calls (24h)</p>
              <p className="text-2xl font-bold mt-1">45,678</p>
              <p className="text-xs text-success mt-1">+12%</p>
            </div>
            <div className="text-center p-4 bg-base-100 rounded-lg">
              <p className="text-sm text-content-muted">Avg Response</p>
              <p className="text-2xl font-bold mt-1">123ms</p>
              <p className="text-xs text-success mt-1">-8%</p>
            </div>
            <div className="text-center p-4 bg-base-100 rounded-lg">
              <p className="text-sm text-content-muted">Error Rate</p>
              <p className="text-2xl font-bold mt-1">0.05%</p>
              <p className="text-xs text-success mt-1">-0.02%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
