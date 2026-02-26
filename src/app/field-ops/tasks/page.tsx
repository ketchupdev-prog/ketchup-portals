'use client';

/**
 * Field Ops Task Management – PRD §6.2.3.
 * Data from GET /api/v1/field/tasks; create via POST; mark done via PATCH status=done.
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

type TaskRow = { id: string; title: string; asset: string; dueDate: string; status: string; assignee: string };

export default function FieldOpsTasksPage() {
  const { addToast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [assetId, setAssetId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assets, setAssets] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  const loadTasks = () => {
    setLoading(true);
    fetch('/api/v1/field/tasks?page=1&limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          setTasks(json.data.map((r: { id: string; title: string; asset_id: string | null; due_date: string | null; status: string; assigned_to: string | null }) => ({
            id: r.id,
            title: r.title ?? '—',
            asset: r.asset_id ?? '—',
            dueDate: r.due_date ? r.due_date.slice(0, 10) : '—',
            status: r.status ?? '—',
            assignee: r.assigned_to ?? '—',
          })));
        } else setTasks([]);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTasks(); }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/field/assets?page=1&limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) setAssets(json.data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name ?? r.id })));
        else setAssets([]);
      })
      .catch(() => { if (!cancelled) setAssets([]); });
    return () => { cancelled = true; };
  }, []);

  const handleMarkDone = async () => {
    if (!selectedTaskId) return;
    try {
      const res = await fetch(`/api/v1/field/tasks/${selectedTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      const json = await res.json();
      if (!res.ok) { addToast(json.error ?? 'Failed to update task.', 'error'); return; }
      setDoneModalOpen(false);
      setSelectedTaskId(null);
      setNotes('');
      addToast('Task marked as done.', 'success');
      loadTasks();
    } catch { addToast('Failed to update task.', 'error'); }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) { addToast('Enter a title.', 'error'); return; }
    try {
      const res = await fetch('/api/v1/field/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), asset_id: assetId || null, due_date: dueDate || null, assigned_to: null }),
      });
      const json = await res.json();
      if (!res.ok) { addToast(json.error ?? 'Failed to create task.', 'error'); return; }
      setCreateModalOpen(false);
      setTitle('');
      setAssetId('');
      setDueDate('');
      addToast('Task created and assigned.', 'success');
      loadTasks();
    } catch { addToast('Failed to create task.', 'error'); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Tasks" description="Assigned tasks; mark done with notes; create and assign (team lead)." />
      <SearchHeader title="My tasks" action={<Button size="sm" onClick={() => setCreateModalOpen(true)}>Create task</Button>} />
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
            cell: (row: TaskRow) => (
              row.status !== 'done' ? (
                <Button variant="outline" size="xs" onClick={() => { setSelectedTaskId(row.id); setDoneModalOpen(true); }}>Mark done</Button>
              ) : null
            ),
          },
        ]}
        data={tasks}
        keyExtractor={(r) => r.id}
        emptyMessage={loading ? 'Loading…' : 'No tasks assigned.'}
      />
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create task">
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Replenish ATM X" />
          <Select options={[{ value: '', label: 'Select asset' }, ...assets.map((a) => ({ value: a.id, label: a.name }))]} value={assetId} onChange={(e) => setAssetId(e.target.value)} placeholder="Select asset" />
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
