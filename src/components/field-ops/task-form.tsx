'use client';

/**
 * TaskForm – Field Ops standalone task create/edit form. PRD §6.2.3.
 * Location: src/components/field-ops/task-form.tsx
 * Uses: Card, Input, Select, Button, Textarea.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface TaskFormProps {
  assets?: { id: string; name: string }[];
  onSubmit?: (payload: { title: string; asset_id: string | null; due_date: string | null; assigned_to: string | null; notes?: string }) => void;
  loading?: boolean;
  submitLabel?: string;
  className?: string;
}

export function TaskForm({
  assets = [],
  onSubmit,
  loading = false,
  submitLabel = 'Create task',
  className = '',
}: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [assetId, setAssetId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      title: title.trim(),
      asset_id: assetId || null,
      due_date: dueDate || null,
      assigned_to: null,
      notes: notes.trim() || undefined,
    });
    setTitle('');
    setAssetId('');
    setDueDate('');
    setNotes('');
  };

  return (
    <Card className={className}>
      <CardHeader><CardTitle>New task</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Replenish ATM X" required />
          <Select
            options={[{ value: '', label: 'Select asset' }, ...assets.map((a) => ({ value: a.id, label: a.name }))]}
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Asset (optional)"
          />
          <Input type="date" label="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" rows={2} />
          <Button type="submit" disabled={loading}>{loading ? 'Creating…' : submitLabel}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
