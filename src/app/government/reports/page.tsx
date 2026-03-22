'use client';

/**
 * Government Reports – Generate PDF reports (FE-001)
 * Location: src/app/government/reports/page.tsx
 * 
 * Purpose: Generate downloadable PDF reports for government oversight
 * Reports: Programme Performance, Audit Log Export
 * 
 * Features:
 * - Programme Performance Report: Shows budget, disbursement, beneficiaries, redemption rates
 * - Audit Log Export: Filtered audit logs with date range, user, action filters
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function GovernmentReportsPage() {
  const { addToast } = useToast();

  // Programme Performance Report State
  const [programmeLoading, setProgrammeLoading] = useState(false);
  const [programmeId, setProgrammeId] = useState('');
  const [programmeStartDate, setProgrammeStartDate] = useState('');
  const [programmeEndDate, setProgrammeEndDate] = useState('');
  const [programmes, setProgrammes] = useState<Array<{ value: string; label: string }>>([]);

  // Audit Export Report State
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditUserId, setAuditUserId] = useState('');
  const [auditAction, setAuditAction] = useState('');

  // Fetch programmes on mount
  useEffect(() => {
    fetch('/api/v1/programmes')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setProgrammes(
            data.data.map((p: any) => ({ value: p.id, label: p.name }))
          );
        }
      })
      .catch((err) => {
        console.error('Failed to fetch programmes:', err);
      });
  }, []);

  /**
   * Generate Programme Performance Report
   */
  const handleGenerateProgrammeReport = async () => {
    // Validation
    if (!programmeId) {
      addToast('Please select a programme', 'error');
      return;
    }
    if (!programmeStartDate || !programmeEndDate) {
      addToast('Please select start and end dates', 'error');
      return;
    }

    setProgrammeLoading(true);

    try {
      const response = await fetch('/api/v1/reports/programme-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId,
          startDate: programmeStartDate,
          endDate: programmeEndDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        addToast(error.error || 'Failed to generate report', 'error');
        setProgrammeLoading(false);
        return;
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `programme-performance-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast('Report generated successfully', 'success');
    } catch (err) {
      console.error('Failed to generate report:', err);
      addToast('Failed to generate report', 'error');
    } finally {
      setProgrammeLoading(false);
    }
  };

  /**
   * Generate Audit Log Export Report
   */
  const handleGenerateAuditReport = async () => {
    // Validation
    if (!auditStartDate || !auditEndDate) {
      addToast('Please select start and end dates', 'error');
      return;
    }

    setAuditLoading(true);

    try {
      const response = await fetch('/api/v1/reports/audit-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: auditStartDate,
          endDate: auditEndDate,
          userId: auditUserId || undefined,
          action: auditAction || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        addToast(error.error || 'Failed to generate report', 'error');
        setAuditLoading(false);
        return;
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-export-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast('Report exported successfully', 'success');
    } catch (err) {
      console.error('Failed to export audit logs:', err);
      addToast('Failed to export audit logs', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports & Exports"
        description="Generate PDF reports for programme performance and audit log exports"
      />

      {/* Programme Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Programme Performance Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Programme"
            options={programmes}
            value={programmeId}
            onChange={(e) => setProgrammeId(e.target.value)}
            placeholder="Select programme"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={programmeStartDate}
              onChange={(e) => setProgrammeStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="End Date"
              value={programmeEndDate}
              onChange={(e) => setProgrammeEndDate(e.target.value)}
            />
          </div>
          <Button
            onClick={handleGenerateProgrammeReport}
            loading={programmeLoading}
            disabled={programmeLoading}
            variant="primary"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Generate PDF
          </Button>
        </CardContent>
      </Card>

      {/* Audit Log Export */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={auditStartDate}
              onChange={(e) => setAuditStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="End Date"
              value={auditEndDate}
              onChange={(e) => setAuditEndDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="User ID (Optional)"
              placeholder="Filter by user ID"
              value={auditUserId}
              onChange={(e) => setAuditUserId(e.target.value)}
            />
            <Select
              label="Action (Optional)"
              options={[
                { value: '', label: 'All Actions' },
                { value: 'voucher.issue', label: 'Voucher Issue' },
                { value: 'agent.float_adjust', label: 'Agent Float Adjustment' },
                { value: 'beneficiary.suspend', label: 'Beneficiary Suspend' },
                { value: 'programme.create', label: 'Programme Create' },
                { value: 'auth.login', label: 'Login' },
              ]}
              value={auditAction}
              onChange={(e) => setAuditAction(e.target.value)}
              placeholder="All Actions"
            />
          </div>
          <Button
            onClick={handleGenerateAuditReport}
            loading={auditLoading}
            disabled={auditLoading}
            variant="primary"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
