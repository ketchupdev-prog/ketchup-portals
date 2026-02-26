'use client';

/**
 * USSD Session Viewer – Ketchup Portal (PRD §3.2.10).
 * Data from GET /api/v1/ussd/sessions and GET /api/v1/ussd/sessions/[id]; filter by user, date.
 */

import { useState, useMemo, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SessionRow = { id: string; userId: string; date: string; duration: string; steps: number };
type SessionStep = { step: number; menu: string; selection: string; timestamp: string };

export default function USSDViewerPage() {
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionDetail, setSessionDetail] = useState<SessionStep[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/ussd/sessions?page=1&limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setSessions(json.data.map((r: { id: string; user_id: string; phone: string | null; created_at: string; session_data: unknown }) => {
            const steps = Array.isArray(r.session_data) ? r.session_data.length : 0;
            return {
              id: r.id,
              userId: r.phone ?? r.user_id ?? '—',
              date: r.created_at.slice(0, 10),
              duration: '—',
              steps,
            };
          }));
        } else setSessions([]);
      })
      .catch(() => { if (!cancelled) setSessions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userFilter]);

  useEffect(() => {
    if (!selectedSessionId) { setSessionDetail(null); return; }
    let cancelled = false;
    fetch(`/api/v1/ussd/sessions/${selectedSessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const sd = json.session_data;
        if (Array.isArray(sd)) {
          setSessionDetail(sd.map((s: { menu?: string; selection?: string; timestamp?: string }, i: number) => ({
            step: i + 1,
            menu: (s as { menu?: string }).menu ?? '—',
            selection: (s as { selection?: string }).selection ?? '—',
            timestamp: (s as { timestamp?: string }).timestamp ?? '—',
          })));
        } else setSessionDetail(null);
      })
      .catch(() => { if (!cancelled) setSessionDetail(null); });
    return () => { cancelled = true; };
  }, [selectedSessionId]);

  const filteredSessions = useMemo(() => {
    let list = [...sessions];
    if (userFilter) list = list.filter((s) => s.userId.includes(userFilter));
    if (dateFilter) list = list.filter((s) => s.date === dateFilter);
    return list;
  }, [sessions, userFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="USSD Session Viewer"
        description="Filter by user, date; view menu selections and timestamps for troubleshooting."
      />
      <SearchHeader
        title="Sessions"
        searchPlaceholder="Search by phone..."
        searchValue={userFilter}
        onSearchChange={setUserFilter}
      />
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input-sm w-40"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          columns={[
            { key: 'userId', header: 'User (phone)' },
            { key: 'date', header: 'Date' },
            { key: 'duration', header: 'Duration' },
            { key: 'steps', header: 'Steps' },
          ]}
          data={filteredSessions}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => setSelectedSessionId(r.id)}
          emptyMessage={loading ? 'Loading…' : 'No sessions.'}
        />
        {selectedSessionId && (
          <Card>
            <CardHeader><CardTitle>Session detail</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-content-muted mb-2">Menu selections and timestamps:</p>
              {sessionDetail && sessionDetail.length > 0 ? (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Menu</th>
                      <th>Selection</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionDetail.map((row) => (
                      <tr key={row.step}>
                        <td>{row.step}</td>
                        <td>{row.menu}</td>
                        <td>{row.selection}</td>
                        <td>{row.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-content-muted">No step data for this session.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
