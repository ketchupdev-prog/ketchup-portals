import { PortalLayoutOrAuthShell } from '@/components/portal-layout/PortalLayoutOrAuthShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutOrAuthShell portal="admin">{children}</PortalLayoutOrAuthShell>;
}
