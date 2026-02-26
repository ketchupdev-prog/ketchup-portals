'use client';

/**
 * UserNav – User dropdown with profile, settings, logout.
 * Location: src/components/ui/user-nav.tsx
 */

import Link from 'next/link';
import { Avatar } from './avatar';
import { cn } from '@/lib/utils';

export interface UserNavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface UserNavProps {
  user?: { name?: string; email?: string; image?: string | null };
  items?: UserNavItem[];
  className?: string;
}

const defaultItems: UserNavItem[] = [
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
  { label: 'Log out', href: '/auth/logout' },
];

export function UserNav({
  user = {},
  items = defaultItems,
  className = '',
}: UserNavProps) {
  const { name = 'User', email, image } = user;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className={cn('dropdown dropdown-end', className)}>
      <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
        <Avatar src={image} alt={name} initials={initials} size="sm" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu menu-sm bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg border border-base-300"
      >
        <li className="menu-title px-4 py-2">
          <span className="font-semibold">{name}</span>
          {email != null && <span className="text-xs text-content-muted block">{email}</span>}
        </li>
        <div className="divider my-0" />
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
