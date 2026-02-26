'use client';

/**
 * Government – Audit exports (PRD §4.2.4).
 * Generate PDF reports: programme performance, ghost payment prevention, incident.
 */

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

const REPORT_OPTIONS = [
  { value: 'performance', label: 'Programme performance summary (budget vs actual)' },
  { value: 'ghost', label: 'Ghost payment prevention report (verification metrics)' },
  { value: 'incident', label: 'Incident report' },
];

export default function GovernmentReportsPage() {
  const { addToast } = useToast();
  const [reportType, setReportType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!reportType) { addToast('Select a report type.', 'error'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('Report generated. (PDF download would be wired to API.)', 'success');
    }, 800);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Audit exports" description="Generate PDF reports for programme performance, ghost payment prevention, incidents." />
      <Card>
        <CardHeader><CardTitle>Generate report</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Report type"
            options={REPORT_OPTIONS}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            placeholder="Select report"
          />
          <Button onClick={handleGenerate} loading={loading} disabled={loading}>
            Generate PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
