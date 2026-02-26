'use client';

/**
 * Auth layout – Wraps login, forgot-password, register with shared shell: main content + footer.
 * Purpose: Hero is per-page (AuthHero); layout adds LandingFooter so every auth step has portal links.
 * Location: src/app/(auth)/layout.tsx
 */

import { LandingFooter } from '@/components/landing';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <main className="flex-1 flex flex-col">{children}</main>
      <LandingFooter />
    </div>
  );
}
