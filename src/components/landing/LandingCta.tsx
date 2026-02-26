'use client';

/**
 * LandingCta – Bottom call-to-action section for the landing page.
 * Purpose: Final CTA before footer. Modular landing section.
 * Location: src/components/landing/LandingCta.tsx
 * Uses: Container, IOSButton (pill, shadow, hover lift).
 */

import { IOSButton } from '@/components/ui/ios-button';
import { Container } from '@/components/ui/container';

export function LandingCta() {
  const scrollToPortals = () => {
    document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 sm:py-24 bg-primary text-primary-content">
      <Container size="md">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-primary-content/90 max-w-xl mx-auto">
            Sign in to your portal to manage operations, view reports, or access your agent or field dashboard.
          </p>
          <div className="mt-8">
            <IOSButton
              variant="secondary"
              size="lg"
              onClick={scrollToPortals}
              className="bg-base-100 text-primary border-0 hover:bg-base-200 shadow-lg"
            >
              Go to portal sign-in
            </IOSButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
