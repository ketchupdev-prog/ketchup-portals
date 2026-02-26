'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/agent/dashboard', label: 'Dashboard' },
  { href: '/agent/float', label: 'Float' },
  { href: '/agent/transactions', label: 'Transactions' },
  { href: '/agent/parcels', label: 'Parcels' },
  { href: '/agent/profile', label: 'Profile' },
];

export function AgentSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300">
        <Link href="/agent/dashboard" className="font-semibold text-lg text-primary">
          Agent Portal
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
