/**
 * Field Ops Portal – Sign in. Per-portal auth; uses shared PortalLoginForm.
 * Location: src/app/field-ops/login/page.tsx
 */

import { PortalLoginForm } from '@/components/auth';

export default function FieldOpsLoginPage() {
  return <PortalLoginForm portal="field-ops" />;
}
