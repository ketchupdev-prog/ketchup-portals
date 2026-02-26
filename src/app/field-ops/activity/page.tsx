'use client';

/**
 * Field Ops Activity – PRD §6.2.4.
 * Activity report: tasks completed, maintenance logs, assets visited (date range).
 * Data from GET /api/v1/field/reports/activity.
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

type AssetVisited = { id?: string; name?: string };
type ActivityData = { tasks_completed: number; maintenance_logs: number; assets_visited: AssetVisited[] };

export default function FieldOpsActivityPage() {
  const { addToast } = useToast();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActivityData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/field/reports/activity?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((json: unknown) => {
        if (cancelled) return;
        const d = json as { tasks_completed?: number; maintenance_logs?: number; assets_visited?: unknown[] };
        setData({
          tasks_completed: d.tasks_completed ?? 0,
          maintenance_logs: d.maintenance_logs ?? 0,
          assets_visited: Array.isArray(d.assets_visited) ? d.assets_visited as AssetVisited[] : [],
        });
      })
      .catch(() => { if (!cancelled) { setData(null); addToast('Failed to load activity.', 'error'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to, addToast]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Activity"
        description="Tasks completed, maintenance logs, and assets visited in the selected date range."
      />
      <div className="flex flex-wrap gap-3 items-end">
        <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        <Button size="sm" onClick={() => { setFrom(new Date().toISOString().slice(0, 10)); setTo(new Date().toISOString().slice(0, 10)); }}>Today</Button>
      </div>
      {loading && <p className="text-sm text-content-muted">Loading…</p>}
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-medium">Tasks completed:</span> {data.tasks_completed ?? 0}</p>
              <p><span className="font-medium">Maintenance logs:</span> {data.maintenance_logs ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Assets visited</CardTitle></CardHeader>
            <CardContent>
              {Array.isArray(data.assets_visited) && data.assets_visited.length > 0
                ? <ul className="list-disc pl-4">{data.assets_visited.map((a, i) => <li key={i}>{a.name ?? a.id ?? '—'}</li>)}</ul>
                : <p className="text-content-muted text-sm">No assets visited in this range.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
