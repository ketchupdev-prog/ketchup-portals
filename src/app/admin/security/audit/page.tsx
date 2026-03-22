'use client';

import { useEffect, useState } from 'react';
import { getAuditLogs, exportAuditLogs } from '@/lib/api/security';
import type { AuditLogFilters, AuditLogResponse, AuditLog } from '@/lib/types/security';

/**
 * Audit Logs Dashboard – System audit logs and user activity tracking
 * PSD-12 Compliance: 7-year retention for critical events
 */

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const response = await getAuditLogs(filters);
    if (response.success && response.data) {
      setLogs(response.data.logs);
      setTotal(response.data.total);
      setError(null);
    } else {
      setError(response.error || 'Failed to load audit logs');
    }
    setLoading(false);
  }

  async function handleExport(format: 'CSV' | 'PDF' | 'JSON') {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select date range for export');
      return;
    }

    setExporting(true);
    const blob = await exportAuditLogs({
      format,
      startDate: filters.startDate,
      endDate: filters.endDate,
      filters,
    });

    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${filters.startDate}-to-${filters.endDate}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      alert('Export failed. Please try again.');
    }
    setExporting(false);
  }

  function handleFilterChange(key: keyof AuditLogFilters, value: any) {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  }

  function handleApplyFilters() {
    loadLogs();
  }

  function handleClearFilters() {
    setFilters({
      limit: 50,
      offset: 0,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
  }

  function handlePagination(direction: 'next' | 'prev') {
    const newOffset = direction === 'next' 
      ? (filters.offset || 0) + (filters.limit || 50)
      : Math.max(0, (filters.offset || 0) - (filters.limit || 50));
    setFilters((prev) => ({ ...prev, offset: newOffset }));
    loadLogs();
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'success';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'blocked':
        return 'error';
      default:
        return 'warning';
    }
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 50));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Audit Logs</h1>
          <p className="text-sm text-content-muted mt-1">
            System audit logs and user activity tracking (PSD-12 7-year retention)
          </p>
        </div>
        <div className="flex gap-2">
          <div className="dropdown dropdown-end">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-sm btn-primary"
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : '📥 Export'}
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
              <li>
                <button onClick={() => handleExport('CSV')}>Export as CSV</button>
              </li>
              <li>
                <button onClick={() => handleExport('PDF')}>Export as PDF</button>
              </li>
              <li>
                <button onClick={() => handleExport('JSON')}>Export as JSON</button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-base">Filters & Search</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Date Range */}
            <div>
              <label className="label label-text text-xs">Start Date</label>
              <input
                type="date"
                className="input input-sm input-bordered w-full"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="label label-text text-xs">End Date</label>
              <input
                type="date"
                className="input input-sm input-bordered w-full"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="label label-text text-xs">Event Type</label>
              <select
                className="select select-sm select-bordered w-full"
                value={filters.eventType || ''}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
              >
                <option value="">All Events</option>
                <option value="auth">Authentication</option>
                <option value="transaction">Transaction</option>
                <option value="config">Configuration</option>
                <option value="access">Access</option>
                <option value="fraud">Fraud</option>
              </select>
            </div>

            {/* Action */}
            <div>
              <label className="label label-text text-xs">Action</label>
              <select
                className="select select-sm select-bordered w-full"
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="view">View</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="label label-text text-xs">Status</label>
              <select
                className="select select-sm select-bordered w-full"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value as any)}
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="label label-text text-xs">Severity</label>
              <select
                className="select select-sm select-bordered w-full"
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value as any)}
              >
                <option value="">All Severity</option>
                <option value="INFO">Info</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* User ID */}
            <div>
              <label className="label label-text text-xs">User ID</label>
              <input
                type="text"
                placeholder="Enter user ID"
                className="input input-sm input-bordered w-full"
                value={filters.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="label label-text text-xs">IP Address</label>
              <input
                type="text"
                placeholder="e.g., 41.182.x.x"
                className="input input-sm input-bordered w-full"
                value={filters.ipAddress || ''}
                onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
              />
            </div>
          </div>

          {/* Full-text Search */}
          <div>
            <label className="label label-text text-xs">Full-Text Search</label>
            <input
              type="text"
              placeholder="Search in all fields..."
              className="input input-sm input-bordered w-full"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button onClick={handleClearFilters} className="btn btn-sm btn-ghost">
              Clear Filters
            </button>
            <button onClick={handleApplyFilters} className="btn btn-sm btn-primary" disabled={loading}>
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-content-muted">
          Showing {logs.length} of {total.toLocaleString()} logs (Page {currentPage} of {totalPages})
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePagination('prev')}
            className="btn btn-sm btn-ghost"
            disabled={(filters.offset || 0) === 0}
          >
            ← Previous
          </button>
          <button
            onClick={() => handlePagination('next')}
            className="btn btn-sm btn-ghost"
            disabled={(filters.offset || 0) + (filters.limit || 50) >= total}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      {error ? (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : logs.length === 0 ? (
        <div className="alert alert-info">
          <span>No audit logs found matching your filters</span>
        </div>
      ) : (
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Event Type</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="max-w-xs truncate">{log.user}</td>
                      <td>
                        <span className="badge badge-ghost badge-sm">{log.eventType}</span>
                      </td>
                      <td>
                        <span className="badge badge-outline badge-sm">{log.action}</span>
                      </td>
                      <td className="font-mono text-xs max-w-xs truncate">{log.resource}</td>
                      <td className="font-mono text-xs">{log.ipAddress}</td>
                      <td>
                        <span className={`badge badge-${getStatusColor(log.status)} badge-sm`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${getSeverityColor(log.severity)} badge-sm`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && logs.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-content-muted">
            Records {(filters.offset || 0) + 1} to {Math.min((filters.offset || 0) + logs.length, total)} of{' '}
            {total.toLocaleString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePagination('prev')}
              className="btn btn-sm btn-ghost"
              disabled={(filters.offset || 0) === 0}
            >
              ← Previous
            </button>
            <span className="btn btn-sm btn-ghost no-animation">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePagination('next')}
              className="btn btn-sm btn-ghost"
              disabled={(filters.offset || 0) + (filters.limit || 50) >= total}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Retention Policy Notice */}
      <div className="card bg-base-300 border-l-4 border-info">
        <div className="card-body py-3">
          <p className="text-sm">
            <span className="font-medium">Retention Policy (PSD-12 §17):</span> Critical events (fraud, breach) -
            7 years | Authentication events - 2 years | Routine events - 1 year
          </p>
        </div>
      </div>
    </div>
  );
}
