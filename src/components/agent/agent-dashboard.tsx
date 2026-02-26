'use client';

import Link from 'next/link';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface AgentDashboardProps {
  floatBalance?: string;
  parcelCount?: number;
  className?: string;
}

export function AgentDashboard({ floatBalance = '0.00', parcelCount = 0, className = '' }: AgentDashboardProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <h1 className="text-2xl font-bold">Agent Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="Float balance" value={floatBalance} variant="default" />
        <MetricCard title="Parcels ready" value={String(parcelCount)} variant="success" />
        <Link href="/agent/float">
          <MetricCard title="Request top-up" value="Request" variant="primary" />
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
        <CardContent>
          <p className="text-content-muted text-sm">No recent transactions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
