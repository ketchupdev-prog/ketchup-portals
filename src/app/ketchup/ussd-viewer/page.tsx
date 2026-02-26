'use client';

/**
 * USSD Session Viewer – Ketchup Portal (PRD §3.2.10).
 * Uses USSDViewer; data from GET /api/v1/ussd/sessions and GET /api/v1/ussd/sessions/[id].
 */

import { useState, useMemo, useEffect } from 'react';
import { USSDViewer, type USSDSessionRow, type USSDStepRow } from '@/components/ketchup';

export default function USSDViewerPage() {
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<USSDSessionRow[]>([]);
  const [sessionDetail, setSessionDetail] = useState<USSDStepRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/ussd/sessions?page=1&limit=100', { credentials: 'include' })
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
  }, []);

  useEffect(() => {
    if (!selectedSessionId) { setSessionDetail(null); return; }
    let cancelled = false;
    fetch(`/api/v1/ussd/sessions/${selectedSessionId}`, { credentials: 'include' })
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
    <USSDViewer
      sessions={filteredSessions}
      loading={loading}
      onSessionSelect={setSelectedSessionId}
      selectedSessionId={selectedSessionId}
      sessionDetail={sessionDetail}
      userFilter={userFilter}
      dateFilter={dateFilter}
      onUserFilterChange={setUserFilter}
      onDateFilterChange={setDateFilter}
    />
  );
}
