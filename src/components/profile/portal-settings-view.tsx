'use client';

/**
 * PortalSettingsView – Shared settings page content for Ketchup, Government, Field Ops.
 * Password and notification sections as placeholders until auth and preferences are wired.
 * Location: src/components/profile/portal-settings-view.tsx
 */

import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { PortalSlug } from './notification-preferences-form';
import { NotificationPreferencesForm } from './notification-preferences-form';

export interface PortalSettingsViewProps {
  title?: string;
  description?: string;
  /** Link back to profile */
  profileHref: string;
  /** Optional link to portal-specific config (e.g. Government → /government/config) */
  configLink?: { href: string; label: string };
  /** Portal name for copy */
  portalName: string;
  /** Portal slug for notification preferences (ketchup | government | field-ops) */
  portal: Extract<PortalSlug, 'ketchup' | 'government' | 'field-ops'>;
  /** Optional: render custom content above notifications (e.g. ChangePasswordForm) */
  children?: React.ReactNode;
}

export function PortalSettingsView({
  title = 'Settings',
  description = 'Password and notification preferences.',
  profileHref,
  configLink,
  portalName,
  portal,
  children,
}: PortalSettingsViewProps) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title={title}
        description={description}
        action={
          <Link href={profileHref} className="btn btn-sm btn-ghost">
            Profile
          </Link>
        }
      />

      {children}

      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent>
          <NotificationPreferencesForm portal={portal} wrapped={false} />
        </CardContent>
      </Card>

      {configLink && (
        <Card>
          <CardHeader><CardTitle>Portal configuration</CardTitle></CardHeader>
          <CardContent>
            <Link href={configLink.href} className="btn btn-sm btn-outline">
              {configLink.label}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
