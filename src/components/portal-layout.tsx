'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { KetchupSidebar } from '@/components/sidebars/ketchup-sidebar';
import { GovernmentSidebar } from '@/components/sidebars/government-sidebar';
import { AgentSidebar } from '@/components/sidebars/agent-sidebar';
import { FieldOpsSidebar } from '@/components/sidebars/field-ops-sidebar';
import { AdminSidebar } from '@/components/sidebars/admin-sidebar';
import { Header } from '@/components/header';
import { getPortalFromPath, getPortalLoginPath } from '@/lib/portal-auth-config';

export interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    fetch('/api/v1/portal/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          const path = pathname || '/ketchup/dashboard';
          const portal = getPortalFromPath(path) ?? 'ketchup';
          router.replace(getPortalLoginPath(portal, path));
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true))
      .finally(() => {
        checkingRef.current = false;
      });
  }, [pathname, router]);

  const sidebar = pathname.startsWith('/ketchup') ? (
    <KetchupSidebar />
  ) : pathname.startsWith('/government') ? (
    <GovernmentSidebar />
  ) : pathname.startsWith('/agent') ? (
    <AgentSidebar />
  ) : pathname.startsWith('/field-ops') ? (
    <FieldOpsSidebar />
  ) : pathname.startsWith('/admin') ? (
    <AdminSidebar />
  ) : null;

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

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
