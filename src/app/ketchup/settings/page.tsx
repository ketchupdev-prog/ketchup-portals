'use client';

/**
 * Ketchup Settings – Password and notification preferences. PRD §7.4.
 * Location: src/app/ketchup/settings/page.tsx
 */

import { PortalSettingsView } from '@/components/profile';
import { ChangePasswordForm } from '@/components/profile';

export default function KetchupSettingsPage() {
  return (
    <PortalSettingsView
      title="Settings"
      description="Password and notification preferences for Ketchup portal."
      profileHref="/ketchup/profile"
      portalName="Ketchup"
      portal="ketchup"
    >
      <ChangePasswordForm />
    </PortalSettingsView>
  );
}
