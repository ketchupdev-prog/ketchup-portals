'use client';

import { usePathname } from 'next/navigation';
import { KetchupSidebar } from '@/components/sidebars/ketchup-sidebar';
import { GovernmentSidebar } from '@/components/sidebars/government-sidebar';
import { AgentSidebar } from '@/components/sidebars/agent-sidebar';
import { FieldOpsSidebar } from '@/components/sidebars/field-ops-sidebar';
import { Header } from '@/components/header';

export interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const pathname = usePathname();

  const sidebar = pathname.startsWith('/ketchup') ? (
    <KetchupSidebar />
  ) : pathname.startsWith('/government') ? (
    <GovernmentSidebar />
  ) : pathname.startsWith('/agent') ? (
    <AgentSidebar />
  ) : pathname.startsWith('/field-ops') ? (
    <FieldOpsSidebar />
  ) : null;

  return (
    <div className="flex h-screen">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-base-100 text-base-content">{children}</main>
      </div>
    </div>
  );
}
