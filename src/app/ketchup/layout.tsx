import { PortalLayout } from '@/components/portal-layout';

export default function KetchupPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayout>{children}</PortalLayout>;
}
