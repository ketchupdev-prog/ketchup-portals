import { PortalLayoutOrAuthShell } from '@/components/portal-layout/PortalLayoutOrAuthShell';

export default function GovernmentLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutOrAuthShell portal="government">{children}</PortalLayoutOrAuthShell>;
}
