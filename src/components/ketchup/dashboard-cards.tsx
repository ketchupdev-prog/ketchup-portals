'use client';

import { MetricCard } from '@/components/ui/metric-card';

export interface DashboardCardsProps {
  activeVouchers?: number;
  beneficiaries?: number;
  agents?: number;
  pendingFloat?: number | string;
}

const defaultStats = [
  { title: 'Active Vouchers', value: '—', change: '', variant: 'ketchup' as const },
  { title: 'Beneficiaries', value: '—', change: '', variant: 'primary' as const },
  { title: 'Agents', value: '—', change: '', variant: 'accent' as const },
  { title: 'Pending Float', value: '—', change: '', variant: 'warning' as const },
];

export function DashboardCards({ activeVouchers, beneficiaries, agents, pendingFloat }: DashboardCardsProps = {}) {
  const stats = [
    { title: 'Active Vouchers', value: activeVouchers != null ? String(activeVouchers) : defaultStats[0].value, change: '', variant: 'ketchup' as const },
    { title: 'Beneficiaries', value: beneficiaries != null ? String(beneficiaries) : defaultStats[1].value, change: '', variant: 'primary' as const },
    { title: 'Agents', value: agents != null ? String(agents) : defaultStats[2].value, change: '', variant: 'accent' as const },
    { title: 'Pending Float', value: pendingFloat != null ? String(pendingFloat) : defaultStats[3].value, change: '', variant: 'warning' as const },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <MetricCard
          key={s.title}
          title={s.title}
          value={s.value}
          change={s.change}
          variant={s.variant}
        />
      ))}
    </div>
  );
}
