'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand-logo';

const items = [
  { href: '/field-ops/map', label: 'Map' },
  { href: '/field-ops/assets', label: 'Assets' },
  { href: '/field-ops/tasks', label: 'Tasks' },
  { href: '/field-ops/activity', label: 'Activity' },
  { href: '/field-ops/routes', label: 'Routes' },
  { href: '/field-ops/reports', label: 'Reports' },
  { href: '/field-ops/profile', label: 'Profile' },
];

export function FieldOpsSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      <div className="p-4 border-b border-base-300 flex items-center gap-2">
        <BrandLogo src="/ketchup-logo.png" variant="mark" width={32} height={32} className="shrink-0 rounded-full" />
        <Link
          href="/field-ops/map"
          className="font-semibold text-lg text-primary"
        >
          Field Ops
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
