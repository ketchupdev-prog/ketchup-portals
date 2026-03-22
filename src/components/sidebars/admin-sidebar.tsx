'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand-logo';

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ href: '/admin/dashboard', label: '📊 Dashboard' }],
  },
  {
    title: 'Compliance',
    items: [
      { href: '/admin/compliance/kri', label: '🏛️ KRI Dashboard' },
      { href: '/admin/compliance/bon-reporting', label: '📄 BoN Reporting' },
      { href: '/admin/compliance/calendar', label: '📅 Compliance Calendar' },
      { href: '/admin/compliance/alerts', label: '🚨 Alerts' },
    ],
  },
  {
    title: 'Financial',
    items: [
      { href: '/admin/financial/reconciliation', label: '💰 Reconciliation' },
      { href: '/admin/financial/transactions', label: '💳 Transactions' },
      { href: '/admin/financial/capital', label: '🏦 Capital Adequacy' },
      { href: '/admin/financial/vouchers', label: '🎫 Vouchers' },
    ],
  },
  {
    title: 'Security',
    items: [
      { href: '/admin/security/overview', label: '🛡️ Overview' },
      { href: '/admin/security/fraud', label: '🚨 Fraud Detection' },
      { href: '/admin/security/audit', label: '📋 Audit Logs' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/admin/analytics/overview', label: '📈 Overview' },
      { href: '/admin/analytics/uptime', label: '⏱️ Uptime (SLA)' },
      { href: '/admin/analytics/mobile-app', label: '📱 Mobile App' },
      { href: '/admin/analytics/transactions', label: '💸 Transactions' },
      { href: '/admin/analytics/agents', label: '👥 Agent Network' },
      { href: '/admin/analytics/ussd', label: '📞 USSD Sessions' },
    ],
  },
  {
    title: 'AI/ML',
    items: [
      { href: '/admin/ai-ml/copilot', label: '🤖 Copilot' },
      { href: '/admin/ai-ml/rag', label: '📚 RAG' },
      { href: '/admin/ai-ml/models', label: '🧠 ML Models' },
      { href: '/admin/ai-ml/duckdb', label: '🦆 DuckDB' },
      { href: '/admin/ai-ml/costs', label: '💰 Costs' },
    ],
  },
  {
    title: 'Settings',
    items: [{ href: '/admin/settings', label: '⚙️ Configuration' }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300 flex items-center gap-2">
        <BrandLogo src="/ketchup-logo.png" variant="mark" width={32} height={32} className="shrink-0 rounded-full" />
        <Link href="/admin/dashboard" className="font-semibold text-lg text-primary">
          Admin Portal
        </Link>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-3 py-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
                {section.title}
              </div>
              <ul className="menu menu-sm">
                {section.items.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className={isActive(href) ? 'active' : ''}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-base-300">
        <div className="text-xs text-content-muted">
          <p className="font-semibold">SmartPay Admin</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
