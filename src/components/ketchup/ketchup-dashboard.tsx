'use client';

/**
 * Ketchup Dashboard – PRD §3.2.1.
 * Fetches KPIs from GET /api/v1/portal/dashboard/summary; renders DrillDownCards, DashboardCards, RecentActivity.
 * Uses LoadingState and ErrorState per PRD §19. On 401, redirects to login so the portal-auth cookie can be set.
 * Location: src/components/ketchup/ketchup-dashboard.tsx
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DrillDownCard } from '@/components/ui/drill-down-card';
import { DashboardCards } from '@/components/ketchup/dashboard-cards';
import { RecentActivity } from '@/components/ketchup/recent-activity';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { getPortalLoginPath } from '@/lib/portal-auth-config';

type Summary = {
  activeVouchers: number;
  beneficiariesCount: number;
  agentsCount: number;
  pendingFloatRequestsCount: number;
};

export function KetchupDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = () => {
    setError(null);
    setLoading(true);
    fetch('/api/v1/portal/dashboard/summary', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/ketchup/dashboard';
          router.replace(getPortalLoginPath('ketchup', returnUrl));
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error(res.status === 403 ? 'Forbidden' : 'Failed to load');
        return res.json();
      })
      .then((json) => {
        setSummary(json.data ?? null);
      })
      .catch((e) => {
        if (e.message !== 'Unauthorized') setError(e.message ?? 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard…" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message={error}
        onRetry={fetchSummary}
      />
    );
  }

  const s = summary ?? {
    activeVouchers: 0,
    beneficiariesCount: 0,
    agentsCount: 0,
    pendingFloatRequestsCount: 0,
  };
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Ketchup Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DrillDownCard
          title="Total Beneficiaries"
          value={fmt(s.beneficiariesCount)}
          href="/ketchup/beneficiaries"
        />
        <DrillDownCard
          title="Active Vouchers"
          value={fmt(s.activeVouchers)}
          href="/ketchup/vouchers?status=available"
        />
        <DrillDownCard
          title="Agents"
          value={fmt(s.agentsCount)}
          href="/ketchup/agents"
        />
        <DrillDownCard
          title="Pending Float Requests"
          value={fmt(s.pendingFloatRequestsCount)}
          href="/ketchup/float-requests?status=pending"
        />
      </div>
      <DashboardCards
        activeVouchers={s.activeVouchers}
        beneficiaries={s.beneficiariesCount}
        agents={s.agentsCount}
        pendingFloat={s.pendingFloatRequestsCount}
      />
      <RecentActivity />
    </div>
  );
}
