import { PortalLayoutOrAuthShell } from '@/components/portal-layout/PortalLayoutOrAuthShell';

export default function FieldOpsLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutOrAuthShell portal="field-ops">{children}</PortalLayoutOrAuthShell>;
}
