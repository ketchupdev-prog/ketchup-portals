'use client';

/**
 * AuthHero – Compact hero for sign-in and forgot-password pages.
 * Purpose: Brand presence, page context, and "Back to home" so auth feels part of the portal journey.
 * Location: src/components/landing/AuthHero.tsx
 * Uses: LogoMark, link to / and /#portals.
 */

import Link from 'next/link';
import { LogoMark } from '@/components/ui/logo-mark';

export interface AuthHeroProps {
  /** Main headline (e.g. "Sign in" or "Reset password") */
  title: string;
  /** Short subline under the headline */
  subline?: string;
}

export function AuthHero({ title, subline }: AuthHeroProps) {
  return (
    <section className="relative flex flex-col items-center justify-center bg-gradient-to-b from-base-200 via-base-100 to-base-200 overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-10">
      {/* Subtle background pattern – matches LandingHero */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10 w-full px-4 text-center">
        <Link
          href="/"
          className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-2xl transition-transform hover:scale-[1.02]"
          aria-label="Ketchup SmartPay home"
        >
          <LogoMark src="/ketchup-logo.png" alt="Ketchup SmartPay" size={80} />
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {title}
        </h1>
        {subline && (
          <p className="mx-auto mt-2 max-w-md text-base text-base-content/80 sm:text-lg">
            {subline}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="link link-primary text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            ← Back to home
          </Link>
          <span className="text-base-content/40">·</span>
          <Link
            href="/#portals"
            className="link link-primary text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            Choose your portal
          </Link>
        </div>
      </div>
    </section>
  );
}
