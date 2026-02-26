'use client';

/**
 * ProgrammeDashboard – Government portal dashboard for programme monitoring (KPIs, charts). PRD §4.2.1.
 * Location: src/components/government/programme-dashboard.tsx
 * Uses: SectionHeader, MetricCard, Card, BarChart.
 */

import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/charts/bar-chart';

export interface ProgrammeDashboardProps {
  totalBudget?: string;
  disbursed?: string;
  remaining?: string;
  beneficiariesReached?: string;
  disbursementByProgramme?: { name: string; value: number }[];
  verifiedPercent?: number;
  unverifiedCount?: number;
  className?: string;
}

export function ProgrammeDashboard({
  totalBudget = 'NAD 45M',
  disbursed = 'NAD 32M',
  remaining = 'NAD 13M',
  beneficiariesReached = '12,450',
  disbursementByProgramme = [
    { name: 'Programme 1', value: 85 },
    { name: 'Programme 2', value: 62 },
    { name: 'Programme 3', value: 91 },
  ],
  verifiedPercent = 94,
  unverifiedCount = 312,
  className = '',
}: ProgrammeDashboardProps) {
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader
        title="Programme Dashboard"
        description="Budget vs disbursed; regional breakdown; verification metrics."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total budget allocated" value={totalBudget} variant="primary" />
        <MetricCard title="Disbursed this quarter" value={disbursed} variant="accent" />
        <MetricCard title="Remaining budget" value={remaining} variant="default" />
        <MetricCard title="Beneficiaries reached" value={beneficiariesReached} variant="success" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Disbursement by programme (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <BarChart data={disbursementByProgramme} xKey="name" bars={[{ dataKey: 'value', name: '%' }]} height={256} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Verification metrics</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm"><span className="font-medium">Beneficiaries verified (last 90 days):</span> {verifiedPercent}%</p>
            <p className="text-sm"><span className="font-medium">Unverified count:</span> {unverifiedCount}</p>
            <Link href="/government/unverified" className="link link-primary text-sm">View unverified list</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
