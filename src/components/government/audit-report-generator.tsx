'use client';

/**
 * AuditReportGenerator – Government audit report generation/export. PRD §4.x.
 * Location: src/components/government/audit-report-generator.tsx
 * Uses: SectionHeader, Card, Button, Select, Input.
 */

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export interface AuditReportGeneratorProps {
  onGenerate?: (params: { programmeId: string; from: string; to: string }) => void;
  loading?: boolean;
  className?: string;
}

export function AuditReportGenerator({ onGenerate, loading = false, className = '' }: AuditReportGeneratorProps) {
  const [programmeId, setProgrammeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const handleGenerate = () => {
    onGenerate?.({ programmeId, from: from || new Date().toISOString().slice(0, 10), to: to || new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="Audit report generator" description="Generate and export audit reports by programme and date range." />
      <Card>
        <CardHeader><CardTitle>Report parameters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select
            options={[{ value: '', label: 'Select programme' }, { value: 'p1', label: 'Programme 1' }, { value: 'p2', label: 'Programme 2' }]}
            value={programmeId}
            onChange={(e) => setProgrammeId(e.target.value)}
            placeholder="Programme"
          />
          <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={loading}>{loading ? 'Generating…' : 'Generate report'}</Button>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
