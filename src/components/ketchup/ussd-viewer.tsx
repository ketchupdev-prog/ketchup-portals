'use client';

/**
 * USSDViewer – Ketchup USSD session viewer (sessions list + session detail). PRD §3.2.10.
 * Location: src/components/ketchup/ussd-viewer.tsx
 * Uses: SectionHeader, SearchHeader, DataTable, Card, Input.
 */

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface USSDSessionRow {
  id: string;
  userId: string;
  date: string;
  duration: string;
  steps: number;
}

export interface USSDStepRow {
  step: number;
  menu: string;
  selection: string;
  timestamp: string;
}

export interface USSDViewerProps {
  sessions: USSDSessionRow[];
  loading?: boolean;
  onSessionSelect?: (sessionId: string) => void;
  selectedSessionId?: string | null;
  sessionDetail?: USSDStepRow[] | null;
  userFilter?: string;
  dateFilter?: string;
  onUserFilterChange?: (value: string) => void;
  onDateFilterChange?: (value: string) => void;
  className?: string;
}

export function USSDViewer({
  sessions,
  loading = false,
  onSessionSelect,
  selectedSessionId = null,
  sessionDetail = null,
  userFilter = '',
  dateFilter = '',
  onUserFilterChange,
  onDateFilterChange,
  className = '',
}: USSDViewerProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="USSD Session Viewer" description="Filter by user, date; view menu selections and timestamps for troubleshooting." />
      <SearchHeader title="Sessions" searchPlaceholder="Search by phone..." searchValue={userFilter} onSearchChange={onUserFilterChange} />
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <Input type="date" value={dateFilter} onChange={(e) => onDateFilterChange?.(e.target.value)} className="input-sm w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          columns={[
            { key: 'userId', header: 'User (phone)' },
            { key: 'date', header: 'Date' },
            { key: 'duration', header: 'Duration' },
            { key: 'steps', header: 'Steps' },
          ]}
          data={sessions}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => onSessionSelect?.(r.id)}
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
