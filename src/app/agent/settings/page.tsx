'use client';

/**
 * Agent Settings – Password, commission (read-only), notifications. PRD §5.2.5, §5.3.5.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ChangePasswordForm, NotificationPreferencesForm } from '@/components/profile';

export default function AgentSettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        description="Password and notification preferences."
        action={
          <Link href="/agent/profile" className="btn btn-sm btn-ghost">
            Profile
          </Link>
        }
      />

      <ChangePasswordForm />

      <Card>
        <CardHeader><CardTitle>Commission rate</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-content-muted">
            Your commission rate is set by Ketchup operations and shown on your Profile page.
          </p>
          <Link href="/agent/profile" className="btn btn-sm btn-ghost mt-2">View profile</Link>
        </CardContent>
      </Card>

      <NotificationPreferencesForm portal="agent" />
    </div>
  );
}
