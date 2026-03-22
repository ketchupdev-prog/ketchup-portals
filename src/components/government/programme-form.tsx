'use client';

/**
 * ProgrammeForm – Government create/edit programme form. PRD §4.x.
 * Location: src/components/government/programme-form.tsx
 * Uses: Card, Input, Select, Button, Textarea.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { REGION_SELECT_OPTIONS } from '@/lib/regions';

export interface ProgrammeFormProps {
  initialValues?: { name: string; budget: string; region: string; description: string };
  onSubmit?: (values: { name: string; budget: string; region: string; description: string }) => void;
  loading?: boolean;
  submitLabel?: string;
  className?: string;
}

export function ProgrammeForm({
  initialValues,
  onSubmit,
  loading = false,
  submitLabel = 'Save programme',
  className = '',
}: ProgrammeFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [budget, setBudget] = useState(initialValues?.budget ?? '');
  const [region, setRegion] = useState(initialValues?.region ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ name, budget, region, description });
  };

  return (
    <Card className={className}>
      <CardHeader><CardTitle>Programme details</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Programme name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Social Grant Q1" required />
          <Input label="Budget (NAD)" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 10000000" />
          <Select
            options={REGION_SELECT_OPTIONS}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Region"
          />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={3} />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : submitLabel}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
