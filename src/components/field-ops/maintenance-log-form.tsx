'use client';

/**
 * MaintenanceLogForm – Field Ops log maintenance for an asset. PRD §6.x.
 * Location: src/components/field-ops/maintenance-log-form.tsx
 * Uses: Card, Input, Select, Button, Textarea.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface MaintenanceLogFormProps {
  assetId?: string;
  assetName?: string;
  onSubmit?: (payload: { asset_id: string; type: string; notes: string; date: string }) => void;
  loading?: boolean;
  className?: string;
}

export function MaintenanceLogForm({
  assetId = '',
  assetName,
  onSubmit,
  loading = false,
  className = '',
}: MaintenanceLogFormProps) {
  const [type, setType] = useState('replenishment');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;
    onSubmit?.({ asset_id: assetId, type, notes: notes.trim(), date });
    setNotes('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <Card className={className}>
      <CardHeader><CardTitle>Log maintenance{assetName ? ` · ${assetName}` : ''}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            options={[
              { value: 'replenishment', label: 'Replenishment' },
              { value: 'repair', label: 'Repair' },
              { value: 'inspection', label: 'Inspection' },
              { value: 'other', label: 'Other' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Type"
          />
          <Input type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Details..." rows={3} />
          <Button type="submit" disabled={loading || !assetId}>{loading ? 'Saving…' : 'Save log'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
