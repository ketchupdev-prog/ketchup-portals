'use client';

/**
 * Government Programme Dashboard – PRD §4.2.1.
 * Summary cards (budget, disbursed, remaining, beneficiaries reached); regional breakdown; verification metrics.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/charts/bar-chart';
import Link from 'next/link';

const BUDGET_DATA = [
  { name: 'Programme 1', value: 85 },
  { name: 'Programme 2', value: 62 },
  { name: 'Programme 3', value: 91 },
];

export default function GovernmentDashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Programme Dashboard"
        description="Budget vs disbursed; regional breakdown; verification metrics."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total budget allocated" value="NAD 45M" variant="primary" />
        <MetricCard title="Disbursed this quarter" value="NAD 32M" variant="accent" />
        <MetricCard title="Remaining budget" value="NAD 13M" variant="default" />
        <MetricCard title="Beneficiaries reached" value="12,450" variant="success" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Disbursement by programme (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <BarChart data={BUDGET_DATA} xKey="name" bars={[{ dataKey: 'value', name: '%' }]} height={256} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Verification metrics</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm"><span className="font-medium">Beneficiaries verified (last 90 days):</span> 94%</p>
            <p className="text-sm"><span className="font-medium">Unverified count:</span> 312</p>
            <Link href="/government/unverified" className="link link-primary text-sm">View unverified list</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
