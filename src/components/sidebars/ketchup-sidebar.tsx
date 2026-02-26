'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand-logo';

const items = [
  { href: '/ketchup/dashboard', label: 'Dashboard' },
  { href: '/ketchup/beneficiaries', label: 'Beneficiaries' },
  { href: '/ketchup/vouchers', label: 'Vouchers' },
  { href: '/ketchup/vouchers/duplicates', label: 'Duplicate Redemptions' },
  { href: '/ketchup/agents', label: 'Agents' },
  { href: '/ketchup/float-requests', label: 'Float requests' },
  { href: '/ketchup/terminal-inventory', label: 'Terminal Inventory' },
  { href: '/ketchup/mobile-units', label: 'Mobile Units' },
  { href: '/ketchup/network-map', label: 'Network Map' },
  { href: '/ketchup/reconciliation', label: 'Reconciliation' },
  { href: '/ketchup/compliance', label: 'Compliance' },
  { href: '/ketchup/audit', label: 'Audit' },
  { href: '/ketchup/app-analytics', label: 'App Analytics' },
  { href: '/ketchup/ussd-viewer', label: 'USSD Viewer' },
  { href: '/ketchup/profile', label: 'Profile' },
];

export function KetchupSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300 flex items-center gap-2">
        <BrandLogo src="/ketchup-logo.png" variant="mark" width={32} height={32} className="shrink-0 rounded-full" />
        <Link href="/ketchup/dashboard" className="font-semibold text-lg text-primary">
          Ketchup Portal
        </Link>
      </div>
      <nav className="flex-1 p-2">
        <ul className="menu menu-md">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className={pathname === href || pathname.startsWith(href + '/') ? 'active' : ''}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
