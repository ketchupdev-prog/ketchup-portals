'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserNav } from '@/components/ui/user-nav';
import { NotificationCenter } from '@/components/ui/notification-center';
import { BrandLogo } from '@/components/ui/brand-logo';

const profileHrefByPortal = (pathname: string): string => {
  if (pathname.startsWith('/agent')) return '/agent/profile';
  if (pathname.startsWith('/ketchup')) return '/ketchup/profile';
  if (pathname.startsWith('/government')) return '/government/profile';
  if (pathname.startsWith('/field-ops')) return '/field-ops/profile';
  return '/profile';
};

const settingsHrefByPortal = (pathname: string): string => {
  if (pathname.startsWith('/agent')) return '/agent/settings';
  if (pathname.startsWith('/ketchup')) return '/ketchup/settings';
  if (pathname.startsWith('/government')) return '/government/settings';
  if (pathname.startsWith('/field-ops')) return '/field-ops/settings';
  return '/settings';
};

export function Header() {
  const pathname = usePathname();
  const portalLabel = pathname.startsWith('/ketchup')
    ? 'Ketchup'
    : pathname.startsWith('/government')
      ? 'Government'
      : pathname.startsWith('/agent')
        ? 'Agent'
        : pathname.startsWith('/field-ops')
          ? 'Field Ops'
          : 'Portal';

  const navItems = [
    { label: 'Profile', href: profileHrefByPortal(pathname) },
    { label: 'Settings', href: settingsHrefByPortal(pathname) },
    { label: 'Log out', href: '/auth/logout' },
  ];

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4 h-16 shadow-sm">
      <div className="flex-1 gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Ketchup SmartPay home">
          <BrandLogo src="/ketchup-logo.png" variant="mark" width={36} height={36} className="rounded-full" />
        </Link>
        <label className="input input-bordered input-sm flex items-center gap-2 max-w-md" aria-label="Search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70" aria-hidden>
            <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754Z" clipRule="evenodd" />
          </svg>
          <input type="text" className="grow" placeholder="Search..." />
        </label>
        <span className="badge badge-ghost badge-sm">{portalLabel}</span>
      </div>
      <div className="flex-none gap-2">
        <NotificationCenter />
        <UserNav user={{ name: 'Portal User', email: 'user@ketchup.cc' }} items={navItems} />
      </div>
    </header>
  );
}
