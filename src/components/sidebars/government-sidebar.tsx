'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/government/dashboard', label: 'Dashboard' },
  { href: '/government/programmes', label: 'Programmes' },
  { href: '/government/unverified', label: 'Unverified beneficiaries' },
  { href: '/government/vouchers', label: 'Voucher monitoring' },
  { href: '/government/reports', label: 'Reports' },
  { href: '/government/config', label: 'Configuration' },
];

export function GovernmentSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300">
        <Link href="/government/dashboard" className="font-semibold text-lg text-primary">
          Government Portal
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
