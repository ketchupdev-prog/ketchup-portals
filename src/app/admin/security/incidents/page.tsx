'use client';

import { useEffect, useState } from 'react';
import {
  getSecurityIncidents,
  getIncidentStats,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  reportIncidentToBoN,
  addIncidentTimelineEntry,
} from '@/lib/api/security';
import type { SecurityIncident, IncidentStats } from '@/lib/types/security';

/**
 * Incident Response Dashboard – Security incident tracking and Bank of Namibia reporting
 * PSD-12 Compliance: 24-hour incident reporting to BoN for CRITICAL/HIGH incidents
 */

export default function IncidentResponsePage() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newIncident, setNewIncident] = useState({
    type: '',
    severity: 'MEDIUM',
    title: '',
    description: '',
    affectedSystems: [] as string[],
  });

  const [timelineEntry, setTimelineEntry] = useState({
    action: '',
    details: '',
  });

  useEffect(() => {
    loadIncidents();
    loadStats();
    const interval = setInterval(() => {
      loadIncidents();
      loadStats();
    }, 60000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function loadIncidents() {
    const response = await getSecurityIncidents(statusFilter);
    if (response.success && response.data) {
      setIncidents(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to load incidents');
    }
    setLoading(false);
  }

  async function loadStats() {
    const response = await getIncidentStats('30d');
    if (response.success && response.data) {
      setStats(response.data);
    }
  }

  async function handleCreateIncident() {
    if (!newIncident.type || !newIncident.title || !newIncident.description) {
      alert('Please fill in all required fields');
      return;
    }

    const response = await createIncident(newIncident);
    if (response.success && response.data) {
      alert('Incident created successfully');
      setShowCreateModal(false);
      setNewIncident({
        type: '',
        severity: 'MEDIUM',
        title: '',
        description: '',
        affectedSystems: [],
      });
      loadIncidents();
      loadStats();
    } else {
      alert(`Failed to create incident: ${response.error}`);
    }
  }

  async function handleUpdateStatus(incidentId: string, status: string) {
    const response = await updateIncidentStatus(incidentId, status);
    if (response.success) {
      await loadIncidents();
      if (selectedIncident?.id === incidentId) {
        const detailResponse = await getIncidentById(incidentId);
        if (detailResponse.success && detailResponse.data) {
          setSelectedIncident(detailResponse.data);
        }
      }
    } else {
      alert(`Failed to update status: ${response.error}`);
    }
  }

  async function handleReportToBoN(incidentId: string) {
    if (!confirm('Are you sure you want to report this incident to the Bank of Namibia?')) {
      return;
    }

    const response = await reportIncidentToBoN(incidentId);
    if (response.success) {
      alert('Incident reported to BoN successfully');
      await loadIncidents();
      if (selectedIncident?.id === incidentId) {
        const detailResponse = await getIncidentById(incidentId);
        if (detailResponse.success && detailResponse.data) {
          setSelectedIncident(detailResponse.data);
        }
      }
    } else {
      alert(`Failed to report to BoN: ${response.error}`);
    }
  }

  async function handleAddTimelineEntry(incidentId: string) {
    if (!timelineEntry.action || !timelineEntry.details) {
      alert('Please fill in action and details');
      return;
    }

    const response = await addIncidentTimelineEntry(incidentId, timelineEntry.action, timelineEntry.details);
    if (response.success) {
      setTimelineEntry({ action: '', details: '' });
      const detailResponse = await getIncidentById(incidentId);
      if (detailResponse.success && detailResponse.data) {
        setSelectedIncident(detailResponse.data);
      }
    } else {
      alert(`Failed to add timeline entry: ${response.error}`);
    }
  }

  async function handleViewDetails(incidentId: string) {
    const response = await getIncidentById(incidentId);
    if (response.success && response.data) {
      setSelectedIncident(response.data);
    } else {
      alert(`Failed to load incident details: ${response.error}`);
    }
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
      case 'open':
        return 'error';
      case 'investigating':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'info';
      default:
        return 'ghost';
    }
  };

  const getDeadlineStatus = (incident: SecurityIncident) => {
    if (!incident.deadline) return null;
    const deadline = new Date(incident.deadline);
    const now = new Date();
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      return { status: 'overdue', color: 'error', text: 'Overdue' };
    } else if (hoursRemaining < 4) {
      return { status: 'urgent', color: 'error', text: `${Math.floor(hoursRemaining)}h remaining` };
    } else if (hoursRemaining < 12) {
      return { status: 'warning', color: 'warning', text: `${Math.floor(hoursRemaining)}h remaining` };
    }
    return { status: 'ok', color: 'success', text: `${Math.floor(hoursRemaining)}h remaining` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Incident Response</h1>
          <p className="text-sm text-content-muted mt-1">
            Security incident tracking and Bank of Namibia reporting (PSD-12 24h deadline)
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-sm btn-primary">
          ➕ Report Incident
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-base-200 border-l-4 border-primary">
            <div className="card-body">
              <h3 className="text-sm font-medium text-content-muted">Total Incidents ({stats.period})</h3>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-xs text-content-muted">Last 30 days</p>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-error">
            <div className="card-body">
              <h3 className="text-sm font-medium text-content-muted">Critical & High</h3>
              <p className="text-3xl font-bold">{stats.bySeverity.critical + stats.bySeverity.high}</p>
              <p className="text-xs text-error">Reported to BoN: {stats.bonReported}</p>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-warning">
            <div className="card-body">
              <h3 className="text-sm font-medium text-content-muted">Open & Investigating</h3>
              <p className="text-3xl font-bold">{stats.byStatus.open + stats.byStatus.investigating}</p>
              <p className="text-xs text-content-muted">Require attention</p>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-success">
            <div className="card-body">
              <h3 className="text-sm font-medium text-content-muted">Avg Resolution Time</h3>
              <p className="text-3xl font-bold">{stats.averageResolutionTime}h</p>
              <p className="text-xs text-content-muted">Mean time to resolve</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          className="select select-sm select-bordered"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Active Incidents Table */}
      {error ? (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      ) : incidents.length === 0 ? (
        <div className="alert alert-info">
          <span>No incidents found</span>
        </div>
      ) : (
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Active Incidents</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Reported</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Deadline</th>
                    <th>BoN</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => {
                    const deadlineStatus = getDeadlineStatus(incident);
                    return (
                      <tr key={incident.id}>
                        <td className="font-mono text-xs">{incident.id}</td>
                        <td>{incident.type}</td>
                        <td className="max-w-xs truncate">{incident.title}</td>
                        <td>
                          <span className={`badge badge-${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                        </td>
                        <td className="font-mono text-xs">
                          {new Date(incident.reportedAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge badge-${getStatusColor(incident.status)}`}>
                            {incident.status}
                          </span>
                        </td>
                        <td className="text-xs">{incident.assignedTo || '-'}</td>
                        <td>
                          {deadlineStatus ? (
                            <span className={`badge badge-${deadlineStatus.color} badge-sm`}>
                              {deadlineStatus.text}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {incident.bonReported ? (
                            <span className="badge badge-success badge-sm">✓</span>
                          ) : (
                            <span className="badge badge-ghost badge-sm">-</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewDetails(incident.id)}
                            className="btn btn-xs btn-primary"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              Incident Details: {selectedIncident.id}
              <span className={`badge badge-${getSeverityColor(selectedIncident.severity)} ml-2`}>
                {selectedIncident.severity}
              </span>
            </h3>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-content-muted">Title</label>
                  <p>{selectedIncident.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-content-muted">Type</label>
                  <p>{selectedIncident.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-content-muted">Status</label>
                  <p>
                    <span className={`badge badge-${getStatusColor(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-content-muted">Reported By</label>
                  <p>{selectedIncident.reportedBy}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-content-muted">Description</label>
                <p className="text-sm mt-1">{selectedIncident.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-content-muted">Affected Systems</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedIncident.affectedSystems.map((system, i) => (
                    <span key={i} className="badge badge-ghost">
                      {system}
                    </span>
                  ))}
                </div>
              </div>

              {/* BoN Reporting */}
              <div className="card bg-base-300">
                <div className="card-body py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Bank of Namibia Reporting</p>
                      {selectedIncident.bonReported ? (
                        <p className="text-xs text-success mt-1">
                          ✓ Reported on {new Date(selectedIncident.bonReportedAt!).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs text-warning mt-1">
                          ⚠️ Not yet reported{' '}
                          {(selectedIncident.severity === 'HIGH' || selectedIncident.severity === 'CRITICAL') &&
                            '(Required for HIGH/CRITICAL)'}
                        </p>
                      )}
                    </div>
                    {!selectedIncident.bonReported &&
                      (selectedIncident.severity === 'HIGH' || selectedIncident.severity === 'CRITICAL') && (
                        <button
                          onClick={() => handleReportToBoN(selectedIncident.id)}
                          className="btn btn-sm btn-error"
                        >
                          Report to BoN
                        </button>
                      )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-bold mb-2">Incident Timeline</h4>
                <div className="space-y-2">
                  {selectedIncident.timeline.map((entry, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="font-mono text-xs text-content-muted whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-content-muted"> by {entry.performedBy}</span>
                        <p className="text-xs text-content-muted mt-1">{entry.details}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Timeline Entry */}
                <div className="mt-4 p-3 bg-base-300 rounded-lg">
                  <p className="text-sm font-medium mb-2">Add Timeline Entry</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Action (e.g., 'Investigation started')"
                      className="input input-sm input-bordered w-full"
                      value={timelineEntry.action}
                      onChange={(e) => setTimelineEntry({ ...timelineEntry, action: e.target.value })}
                    />
                    <textarea
                      placeholder="Details..."
                      className="textarea textarea-sm textarea-bordered w-full"
                      rows={2}
                      value={timelineEntry.details}
                      onChange={(e) => setTimelineEntry({ ...timelineEntry, details: e.target.value })}
                    />
                    <button
                      onClick={() => handleAddTimelineEntry(selectedIncident.id)}
                      className="btn btn-xs btn-primary"
                    >
                      Add Entry
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setSelectedIncident(null)} className="btn btn-ghost">
                  Close
                </button>
                {selectedIncident.status === 'open' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'investigating')}
                    className="btn btn-warning"
                  >
                    Start Investigation
                  </button>
                )}
                {selectedIncident.status === 'investigating' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'resolved')}
                    className="btn btn-success"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedIncident.status === 'resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'closed')}
                    className="btn btn-info"
                  >
                    Close Incident
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedIncident(null)}></div>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Report New Incident</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Incident Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={newIncident.type}
                  onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                >
                  <option value="">Select type...</option>
                  <option value="Data Breach">Data Breach</option>
                  <option value="DDoS Attack">DDoS Attack</option>
                  <option value="Unauthorized Access">Unauthorized Access</option>
                  <option value="Malware">Malware</option>
                  <option value="Phishing">Phishing</option>
                  <option value="System Outage">System Outage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Severity</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief description..."
                  className="input input-bordered w-full"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Detailed description of the incident..."
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Affected Systems (comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Auth Server, Payment API"
                  className="input input-bordered w-full"
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      affectedSystems: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                />
              </div>

              {(newIncident.severity === 'HIGH' || newIncident.severity === 'CRITICAL') && (
                <div className="alert alert-warning">
                  <span className="text-xs">
                    ⚠️ HIGH and CRITICAL incidents must be reported to Bank of Namibia within 24 hours
                  </span>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={handleCreateIncident} className="btn btn-primary">
                Create Incident
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}></div>
        </div>
      )}
    </div>
  );
}
