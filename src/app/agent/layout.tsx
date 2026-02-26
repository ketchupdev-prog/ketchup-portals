import { PortalLayoutOrAuthShell } from '@/components/portal-layout/PortalLayoutOrAuthShell';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutOrAuthShell portal="agent">{children}</PortalLayoutOrAuthShell>;
}
