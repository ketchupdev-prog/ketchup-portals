'use client';

/**
 * LandingHero – Hero section for the Ketchup SmartPay landing page.
 * Purpose: Brand presence, value proposition, primary CTA. Modular landing section.
 * Location: src/components/landing/LandingHero.tsx
 * Uses: IOSButton (pill, shadow, hover lift), Container, BrandLogo/Image.
 */

import Link from 'next/link';
import Image from 'next/image';
import { IOSButton } from '@/components/ui/ios-button';

export function LandingHero() {
  const scrollTo = (id: string) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center bg-gradient-to-b from-base-200 via-base-100 to-base-200 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="relative z-10 w-full px-4 py-16 sm:py-24 text-center">
        <Link href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-2xl transition-transform hover:scale-[1.02]">
          <Image
            src="/ketchup-logo.png"
            alt="Ketchup SmartPay"
            width={160}
            height={160}
            className="mx-auto object-contain drop-shadow-xl"
            priority
          />
        </Link>
        <h1 className="mt-8 text-4xl font-bold tracking-tight text-base-content sm:text-5xl md:text-6xl">
          Powering the <span className="text-primary">G2P</span> economy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-base-content/80 sm:text-xl">
          Secure, compliant government-to-person disbursements. One platform for operations, oversight, agents, and field teams.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <IOSButton variant="primary" size="lg" onClick={scrollTo('portals')}>
            Sign in to your portal
          </IOSButton>
          <IOSButton variant="outline" size="lg" onClick={scrollTo('overview')}>
            Learn more
          </IOSButton>
        </div>
      </div>
    </section>
  );
}
