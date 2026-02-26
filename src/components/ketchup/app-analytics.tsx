'use client';

/**
 * AppAnalytics – Ketchup app usage analytics (DAU, MAU, channel breakdown, app users). PRD §3.2.9.
 * Location: src/components/ketchup/app-analytics.tsx
 * Uses: SectionHeader, MetricCard, Card, LineChart, BarChart, DataTable, Tabs.
 */

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { LineChart } from '@/components/charts/line-chart';
import { BarChart } from '@/components/charts/bar-chart';

export interface AppUserRow {
  id: string;
  email: string;
  lastLogin: string;
  deviceOs: string;
  appVersion: string;
}

export interface AppAnalyticsProps {
  dau?: string;
  mau?: string;
  redemptionRate?: string;
  channelAppPercent?: number;
  channelUssdPercent?: number;
  dauTrend?: { name: string; value: number }[];
  channelData?: { name: string; value: number }[];
  appUsers?: AppUserRow[];
  className?: string;
}

export function AppAnalytics({
  dau = '1,457',
  mau = '12,340',
  redemptionRate = '94%',
  channelAppPercent = 72,
  channelUssdPercent = 28,
  dauTrend = [
    { name: 'Mon', value: 1200 },
    { name: 'Tue', value: 1350 },
    { name: 'Wed', value: 1100 },
    { name: 'Thu', value: 1450 },
    { name: 'Fri', value: 1600 },
    { name: 'Sat', value: 1800 },
    { name: 'Sun', value: 1700 },
  ],
  channelData = [
    { name: 'App', value: 72 },
    { name: 'USSD', value: 28 },
  ],
  appUsers = [],
  className = '',
}: AppAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    {
      key: 'analytics',
      label: 'Analytics',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="DAU (7d avg)" value={dau} variant="primary" />
            <MetricCard title="MAU" value={mau} variant="accent" />
            <MetricCard title="Redemption rate" value={redemptionRate} variant="success" />
            <MetricCard title="App vs USSD" value={`${channelAppPercent}% / ${channelUssdPercent}%`} variant="default" />
          </div>
          <Card>
            <CardHeader><CardTitle>DAU trend (last 7 days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 min-h-64 w-full">
                <LineChart data={dauTrend} xKey="name" lines={[{ dataKey: 'value', name: 'DAU' }]} height={256} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Channel breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 min-h-48 w-full">
                <BarChart data={channelData} xKey="name" bars={[{ dataKey: 'value', name: 'Share %' }]} height={192} />
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
            data={appUsers}
            keyExtractor={(r) => r.id}
            emptyMessage="No app users."
          />
        </div>
      ),
    },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title="App Analytics" description="DAU/MAU, redemption rate, channel breakdown (app vs USSD); app user list." />
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="bordered" />
    </div>
  );
}
