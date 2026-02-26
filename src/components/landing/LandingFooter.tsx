'use client';

/**
 * LandingFooter – Footer for the landing page with logo, links, and copyright.
 * Purpose: Brand, navigation, legal. Modular landing section.
 * Location: src/components/landing/LandingFooter.tsx
 * Uses: Container, BrandLogo / LogoMark for logo.
 */

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { LogoMark } from '@/components/ui/logo-mark';

const FOOTER_LINKS = [
  { label: 'Ketchup Portal', href: '/ketchup/login' },
  { label: 'Government Portal', href: '/government/login' },
  { label: 'Agent Portal', href: '/agent/login' },
  { label: 'Field Ops', href: '/field-ops/login' },
];

export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-base-300 bg-base-100 py-12">
      <Container size="lg">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
          <Link href="/" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <LogoMark src="/ketchup-logo.png" alt="Ketchup SmartPay" size={48} />
            <span className="font-semibold text-base-content">Ketchup SmartPay</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-6 sm:gap-8" aria-label="Footer navigation">
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-base-content/70 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 pt-8 border-t border-base-300 text-center sm:text-left">
          <p className="text-sm text-base-content/60">
            © {year} Ketchup Software Solutions. G2P Operations, Compliance & Field Management.
          </p>
          <p className="mt-1 text-xs text-base-content/50">
            Secure, compliant disbursements for the Namibian G2P economy.
          </p>
        </div>
      </Container>
    </footer>
  );
}
