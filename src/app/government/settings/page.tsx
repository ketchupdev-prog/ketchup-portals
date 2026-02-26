'use client';

/**
 * Government Settings – Password, notifications, link to Configuration. PRD §7.4.
 * Location: src/app/government/settings/page.tsx
 */

import { PortalSettingsView } from '@/components/profile';
import { ChangePasswordForm } from '@/components/profile';

export default function GovernmentSettingsPage() {
  return (
    <PortalSettingsView
      title="Settings"
      description="Password and notification preferences for Government portal."
      profileHref="/government/profile"
      configLink={{ href: '/government/config', label: 'Open Configuration' }}
      portalName="Government"
      portal="government"
    >
      <ChangePasswordForm />
    </PortalSettingsView>
  );
}
