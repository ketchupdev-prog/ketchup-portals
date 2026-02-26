'use client';

/**
 * AgentDetail – Ketchup agent detail view (float, terminals, history). PRD §3.x.
 * Location: src/components/ketchup/agent-detail.tsx
 * Uses: SectionHeader, Card, DescriptionList, MetricCard, DataTable.
 */

import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

export interface AgentDetailProps {
  id: string;
  name: string;
  code?: string;
  status?: string;
  floatBalance?: string;
  terminalCount?: number;
  lastActivity?: string;
  recentHistory?: { id: string; date: string; type: string; amount: string }[];
  floatRequestsLink?: string;
  className?: string;
}

export function AgentDetail({
  id,
  name,
  code = '—',
  status = '—',
  floatBalance = 'NAD 0',
  terminalCount = 0,
  lastActivity = '—',
  recentHistory = [],
  floatRequestsLink = '/ketchup/float-requests',
  className = '',
}: AgentDetailProps) {
  const items = [
    { term: 'ID', description: id },
    { term: 'Name', description: name },
    { term: 'Code', description: code },
    { term: 'Status', description: status },
    { term: 'Last activity', description: lastActivity },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title={name} description={`Agent · ${status}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard title="Float balance" value={floatBalance} variant="primary" />
        <MetricCard title="Terminals" value={String(terminalCount)} variant="default" />
      </div>
      <Card>
        <CardHeader><CardTitle>Agent details</CardTitle></CardHeader>
        <CardContent>
          <DescriptionList items={items} layout="stack" />
          {floatRequestsLink && (
            <Link href={floatRequestsLink} className="inline-block mt-4">
              <Button size="sm" variant="outline">View float requests</Button>
            </Link>
          )}
        </CardContent>
      </Card>
      {recentHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={[{ key: 'date', header: 'Date' }, { key: 'type', header: 'Type' }, { key: 'amount', header: 'Amount' }]}
              data={recentHistory}
              keyExtractor={(r) => r.id}
              emptyMessage="No recent activity."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
