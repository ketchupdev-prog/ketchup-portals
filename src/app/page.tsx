'use client';

/**
 * Landing page (home) – Ketchup SmartPay. Modular sections: Hero, Overview, Portals, CTA, Footer.
 * PRD §2.2 Landing Page. Users choose a portal and are sent to login with redirect to that portal.
 * Location: src/app/page.tsx
 */

import {
  LandingHero,
  LandingOverview,
  LandingPortals,
  LandingCta,
  LandingFooter,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <LandingHero />
      <LandingOverview />
      <LandingPortals />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
