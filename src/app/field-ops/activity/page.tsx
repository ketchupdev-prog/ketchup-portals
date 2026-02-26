'use client';

/**
 * Field Ops Activity – PRD §6.2.4.
 * Data from GET /api/v1/field/reports/activity. Uses ActivityReport with activity_rows; summary cards from API.
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityReport, type ActivityReportRow } from '@/components/field-ops';
import { useToast } from '@/components/ui/toast';

type AssetVisited = { id?: string; name?: string };

export default function FieldOpsActivityPage() {
  const { addToast } = useToast();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [maintenanceLogs, setMaintenanceLogs] = useState(0);
  const [assetsVisited, setAssetsVisited] = useState<AssetVisited[]>([]);
  const [activityRows, setActivityRows] = useState<ActivityReportRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/field/reports/activity?from=${from}&to=${to}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json: { tasks_completed?: number; maintenance_logs?: number; assets_visited?: AssetVisited[]; activity_rows?: ActivityReportRow[] }) => {
        if (cancelled) return;
        setTasksCompleted(json.tasks_completed ?? 0);
        setMaintenanceLogs(json.maintenance_logs ?? 0);
        setAssetsVisited(Array.isArray(json.assets_visited) ? json.assets_visited : []);
        setActivityRows(Array.isArray(json.activity_rows) ? json.activity_rows : []);
      })
      .catch(() => { if (!cancelled) { setActivityRows([]); addToast('Failed to load activity.', 'error'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to, addToast]);

  const handleExport = () => {
    const header = 'date,tech,asset,activity,duration';
    const body = activityRows.map((r) => [r.date, r.tech, r.asset, r.activity, r.duration ?? ''].join(',')).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Activity exported.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        <Button size="sm" onClick={() => { setFrom(new Date().toISOString().slice(0, 10)); setTo(new Date().toISOString().slice(0, 10)); }}>Today</Button>
      </div>
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-medium">Tasks completed:</span> {tasksCompleted}</p>
              <p><span className="font-medium">Maintenance logs:</span> {maintenanceLogs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Assets visited</CardTitle></CardHeader>
            <CardContent>
              {assetsVisited.length > 0
                ? <ul className="list-disc pl-4">{assetsVisited.map((a, i) => <li key={a.id ?? i}>{a.name ?? a.id ?? ''}</li>)}</ul>
                : <p className="text-content-muted text-sm">No assets visited in this range.</p>}
            </CardContent>
          </Card>
        </div>
      )}
      <ActivityReport data={activityRows} loading={loading} onExport={handleExport} />
    </div>
  );
}
