'use client';

/**
 * Beneficiary Platform Admin – App Analytics (PRD §3.2.9).
 * App user list; DAU/MAU, redemption rate, channel breakdown (app vs USSD), heatmap of usage.
 */

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/charts/line-chart';
import { BarChart } from '@/components/charts/bar-chart';

const SAMPLE_APP_USERS = [
  { id: '1', email: 'user1@example.com', lastLogin: '2025-02-22 14:00', deviceOs: 'Android', appVersion: '2.1.0' },
  { id: '2', email: 'user2@example.com', lastLogin: '2025-02-21 10:30', deviceOs: 'iOS', appVersion: '2.1.0' },
];

const DAU_DATA = [
  { name: 'Mon', value: 1200 },
  { name: 'Tue', value: 1350 },
  { name: 'Wed', value: 1100 },
  { name: 'Thu', value: 1450 },
  { name: 'Fri', value: 1600 },
  { name: 'Sat', value: 1800 },
  { name: 'Sun', value: 1700 },
];

const CHANNEL_DATA = [
  { name: 'App', value: 72 },
  { name: 'USSD', value: 28 },
];

export default function AppAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    {
      key: 'analytics',
      label: 'Analytics',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="DAU (7d avg)" value="1,457" variant="primary" />
            <MetricCard title="MAU" value="12,340" variant="accent" />
            <MetricCard title="Redemption rate" value="94%" variant="success" />
            <MetricCard title="App vs USSD" value="72% / 28%" variant="default" />
          </div>
          <Card>
            <CardHeader><CardTitle>DAU trend (last 7 days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 min-h-[256px] w-full">
                <LineChart data={DAU_DATA} xKey="name" lines={[{ dataKey: 'value', name: 'DAU' }]} height={256} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Channel breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 min-h-[192px] w-full">
                <BarChart data={CHANNEL_DATA} xKey="name" bars={[{ dataKey: 'value', name: 'Share %' }]} height={192} />
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      key: 'users',
      label: 'App users',
      content: (
        <div className="space-y-4">
          <SearchHeader title="Registered app users" searchPlaceholder="Search by email..." />
          <DataTable
            columns={[
              { key: 'email', header: 'Email' },
              { key: 'lastLogin', header: 'Last login' },
              { key: 'deviceOs', header: 'Device' },
              { key: 'appVersion', header: 'App version' },
            ]}
            data={SAMPLE_APP_USERS}
            keyExtractor={(r) => r.id}
            emptyMessage="No app users."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="App Analytics"
        description="DAU/MAU, redemption rate, channel breakdown (app vs USSD); app user list."
      />
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="bordered" />
    </div>
  );
}
