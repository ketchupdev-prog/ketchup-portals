'use client';

/**
 * Field Ops Settings – Password and notification preferences. PRD §6.3.3, §7.4.
 * Location: src/app/field-ops/settings/page.tsx
 */

import { PortalSettingsView } from '@/components/profile';
import { ChangePasswordForm } from '@/components/profile';

export default function FieldOpsSettingsPage() {
  return (
    <PortalSettingsView
      title="Settings"
      description="Password and notification preferences for Field Ops."
      profileHref="/field-ops/profile"
      portalName="Field Ops"
      portal="field-ops"
    >
      <ChangePasswordForm />
    </PortalSettingsView>
  );
}
