/**
 * Government Portal – Sign in. Per-portal auth; uses shared PortalLoginForm.
 * Location: src/app/government/login/page.tsx
 */

import { PortalLoginForm } from '@/components/auth';

export default function GovernmentLoginPage() {
  return <PortalLoginForm portal="government" />;
}
