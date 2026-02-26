'use client';

/**
 * Ketchup Dashboard – PRD §3.2.1.
 * Fetches counts from API and renders DrillDownCards + DashboardCards + RecentActivity.
 * Location: src/components/ketchup/ketchup-dashboard.tsx
 */

import { useState, useEffect } from 'react';
import { DrillDownCard } from '@/components/ui/drill-down-card';
import { DashboardCards } from '@/components/ketchup/dashboard-cards';
import { RecentActivity } from '@/components/ketchup/recent-activity';

type Counts = {
  beneficiaries: number;
  vouchers: number;
  activeVouchers: number;
  agents: number;
};

export function KetchupDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/v1/beneficiaries?page=1&limit=1').then((r) => r.json()),
      fetch('/api/v1/vouchers?page=1&limit=1').then((r) => r.json()),
      fetch('/api/v1/vouchers?status=available&page=1&limit=1').then((r) => r.json()),
      fetch('/api/v1/agents?page=1&limit=1').then((r) => r.json()),
    ])
      .then(([b, v, av, a]) => {
        if (cancelled) return;
        setCounts({
          beneficiaries: b.meta?.totalRecords ?? 0,
          vouchers: v.meta?.totalRecords ?? 0,
          activeVouchers: av.meta?.totalRecords ?? 0,
          agents: a.meta?.totalRecords ?? 0,
        });
      })
      .catch(() => { if (!cancelled) setCounts(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Ketchup Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DrillDownCard
          title="Total Beneficiaries"
          value={loading ? '—' : fmt(counts?.beneficiaries ?? 0)}
          href="/ketchup/beneficiaries"
        />
        <DrillDownCard
          title="Vouchers Issued"
          value={loading ? '—' : fmt(counts?.vouchers ?? 0)}
          href="/ketchup/vouchers"
        />
        <DrillDownCard
          title="Agents"
          value={loading ? '—' : fmt(counts?.agents ?? 0)}
          href="/ketchup/agents"
        />
      </div>
      <DashboardCards
        activeVouchers={loading ? undefined : counts?.activeVouchers}
        beneficiaries={loading ? undefined : counts?.beneficiaries}
        agents={loading ? undefined : counts?.agents}
      />
      <RecentActivity />
    </div>
  );
}
