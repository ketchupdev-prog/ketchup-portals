'use client';

/**
 * Field Ops Task Management – PRD §6.2.3.
 * Data from GET /api/v1/field/tasks; create via POST; mark done via PATCH status=done.
 * Uses TaskList component (COMPONENT_INVENTORY §11 Field Ops).
 */

import { useState, useEffect } from 'react';
import { TaskList, type TaskRow } from '@/components/field-ops/task-list';

export default function FieldOpsTasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [assets, setAssets] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = () => {
    setLoading(true);
    fetch('/api/v1/field/tasks?page=1&limit=100', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          setTasks(
            json.data.map(
              (r: {
                id: string;
                title: string;
                asset_id: string | null;
                due_date: string | null;
                status: string;
                assigned_to: string | null;
              }) => ({
                id: r.id,
                title: r.title ?? '—',
                asset: r.asset_id ?? '—',
                dueDate: r.due_date ? r.due_date.slice(0, 10) : '—',
                status: r.status ?? '—',
                assignee: r.assigned_to ?? '—',
              })
            )
          );
        } else setTasks([]);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/field/assets?page=1&limit=100', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data))
          setAssets(json.data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name ?? r.id })));
        else setAssets([]);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateTask = async (payload: {
    title: string;
    asset_id: string | null;
    due_date: string | null;
    assigned_to: string | null;
  }) => {
    const res = await fetch('/api/v1/field/tasks', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to create task.');
  };

  const handleMarkDone = async (taskId: string, _notes?: string) => {
    const res = await fetch(`/api/v1/field/tasks/${taskId}`, {
      credentials: 'include',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to update task.');
  };

  return (
    <TaskList
      tasks={tasks}
      loading={loading}
      assets={assets}
      onLoad={loadTasks}
      onCreateTask={handleCreateTask}
      onMarkDone={handleMarkDone}
    />
  );
}
