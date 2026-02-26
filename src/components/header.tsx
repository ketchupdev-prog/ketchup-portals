'use client';

import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/ui/user-nav';
import { NotificationCenter } from '@/components/ui/notification-center';

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

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4 h-16 shadow-sm">
      <div className="flex-1 gap-4">
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
        <UserNav user={{ name: 'Portal User', email: 'user@ketchup.cc' }} />
      </div>
    </header>
  );
}
