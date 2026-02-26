/**
 * Ketchup Portal – Sign in. Per-portal auth; uses shared PortalLoginForm.
 * Location: src/app/ketchup/login/page.tsx
 */

import { PortalLoginForm } from '@/components/auth';

export default function KetchupLoginPage() {
  return <PortalLoginForm portal="ketchup" />;
}
