'use client';

/**
 * PortalProfileView – Shared account/profile view for Ketchup, Government, and Field Ops portals.
 * Shows name, email, role; placeholder data until auth is wired. Reuses SectionHeader, Card, DescriptionList.
 * Location: src/components/profile/portal-profile-view.tsx
 */

import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import Link from 'next/link';

export interface PortalProfileViewProps {
  title?: string;
  description?: string;
  roleLabel: string;
  name?: string | null;
  email?: string | null;
  settingsHref?: string;
  /** Extra rows for the description list (e.g. department, region) */
  extraItems?: Array<{ term: string; description: React.ReactNode }>;
}

const defaultName = 'Portal User';
const defaultEmail = 'user@ketchup.cc';

export function PortalProfileView({
  title = 'Profile',
  description = 'Your account and portal settings.',
  roleLabel,
  name,
  email,
  settingsHref,
  extraItems = [],
}: PortalProfileViewProps) {
  const displayName = name ?? defaultName;
  const displayEmail = email ?? defaultEmail;

  const items = [
    { term: 'Name', description: displayName },
    { term: 'Email', description: displayEmail },
    { term: 'Role', description: roleLabel },
    ...extraItems,
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title={title}
        description={description}
        action={
          settingsHref ? (
            <Link href={settingsHref} className="btn btn-sm btn-ghost">
              Settings
            </Link>
          ) : undefined
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <DescriptionList items={items} layout="stack" />
        </CardContent>
      </Card>
      <p className="text-sm text-content-muted">
        To update your name or email, sign in with your organisation’s auth when available.
      </p>
    </div>
  );
}
