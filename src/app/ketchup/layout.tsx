import { PortalLayoutOrAuthShell } from '@/components/portal-layout/PortalLayoutOrAuthShell';

export default function KetchupPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayoutOrAuthShell portal="ketchup">{children}</PortalLayoutOrAuthShell>;
}
