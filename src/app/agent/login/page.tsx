/**
 * Agent Portal – Sign in. Per-portal auth; uses shared PortalLoginForm.
 * Location: src/app/agent/login/page.tsx
 */

import { PortalLoginForm } from '@/components/auth';

export default function AgentLoginPage() {
  return <PortalLoginForm portal="agent" />;
}
