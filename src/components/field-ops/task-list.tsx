'use client';

/**
 * TaskList – Field Ops task list with columns, create modal, mark-done modal. COMPONENT_INVENTORY §11 Field Ops.
 * Uses DataTable, Button, Modal, Input, Textarea, Select. Used by field-ops/tasks page.
 * Location: src/components/field-ops/task-list.tsx
 */

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

export type TaskRow = {
  id: string;
  title: string;
  asset: string;
  dueDate: string;
  status: string;
  assignee: string;
};

export interface TaskListProps {
  tasks: TaskRow[];
  loading: boolean;
  assets: { id: string; name: string }[];
  onLoad: () => void;
  onCreateTask: (payload: { title: string; asset_id: string | null; due_date: string | null; assigned_to: string | null }) => Promise<void>;
  onMarkDone: (taskId: string, notes?: string) => Promise<void>;
}

export function TaskList({
  tasks,
  loading,
  assets,
  onLoad,
  onCreateTask,
  onMarkDone,
}: TaskListProps) {
  const { addToast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [assetId, setAssetId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleMarkDone = async () => {
    if (!selectedTaskId) return;
    try {
      await onMarkDone(selectedTaskId, notes);
      setDoneModalOpen(false);
      setSelectedTaskId(null);
      setNotes('');
      addToast('Task marked as done.', 'success');
      onLoad();
    } catch {
      addToast('Failed to update task.', 'error');
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      addToast('Enter a title.', 'error');
      return;
    }
    try {
      await onCreateTask({
        title: title.trim(),
        asset_id: assetId || null,
        due_date: dueDate || null,
        assigned_to: null,
      });
      setCreateModalOpen(false);
      setTitle('');
      setAssetId('');
      setDueDate('');
      addToast('Task created and assigned.', 'success');
      onLoad();
    } catch {
      addToast('Failed to create task.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Tasks" description="Assigned tasks; mark done with notes; create and assign (team lead)." />
      <SearchHeader
        title="My tasks"
        action={<Button size="sm" onClick={() => setCreateModalOpen(true)}>Create task</Button>}
      />
      <DataTable
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'asset', header: 'Asset' },
          { key: 'dueDate', header: 'Due' },
          { key: 'status', header: 'Status' },
          { key: 'assignee', header: 'Assignee' },
          {
            key: 'actions',
            header: 'Actions',
            cell: (row: TaskRow) =>
              row.status !== 'done' ? (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setSelectedTaskId(row.id);
                    setDoneModalOpen(true);
                  }}
                >
                  Mark done
                </Button>
              ) : null,
          },
        ]}
        data={tasks}
        keyExtractor={(r) => r.id}
        emptyMessage={loading ? 'Loading…' : 'No tasks assigned.'}
      />
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create task">
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Replenish ATM X" />
          <Select
            options={[{ value: '', label: 'Select asset' }, ...assets.map((a) => ({ value: a.id, label: a.name }))]}
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Select asset"
          />
          <Input type="date" label="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask}>Create</Button>
          </div>
        </div>
      </Modal>
      <Modal open={doneModalOpen} onClose={() => setDoneModalOpen(false)} title="Mark task done">
        <div className="space-y-4">
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={3} />
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setDoneModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkDone}>Mark done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
