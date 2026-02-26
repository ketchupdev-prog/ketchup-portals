'use client';

/**
 * LandingPortals – Portal entry cards for the landing page.
 * Purpose: Let users choose their portal; each links to that portal's own login (e.g. /ketchup/login) for DNS-friendly URLs.
 * Location: src/components/landing/LandingPortals.tsx
 * Uses: Container, Card (CardHeader, CardTitle, CardContent), Badge, PillButton-style link.
 */

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPortalLoginPath } from '@/lib/portal-auth-config';

const PORTALS = [
  { portal: 'ketchup' as const, path: '/ketchup/dashboard', title: 'Ketchup Portal', description: 'Operations, beneficiaries, vouchers, agents, reconciliation, compliance & audit.', badge: 'Operations' },
  { portal: 'government' as const, path: '/government/dashboard', title: 'Government Portal', description: 'Programme monitoring, unverified beneficiaries, voucher oversight, reports.', badge: 'Oversight' },
  { portal: 'agent' as const, path: '/agent/dashboard', title: 'Agent Portal', description: 'Float balance, transactions, parcels, settlement & commission statements.', badge: 'Agents' },
  { portal: 'field-ops' as const, path: '/field-ops/map', title: 'Field Ops Portal', description: 'Map, assets, tasks, activity, routes & field reports.', badge: 'Field' },
] as const;

export function LandingPortals() {
  return (
    <section id="portals" className="py-16 sm:py-24 bg-base-200">
      <Container size="lg">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-bold text-base-content sm:text-4xl">
            Sign in to your portal
          </h2>
          <p className="mt-4 text-lg text-base-content/80">
            Choose your role below. You’ll be taken to sign in and then straight into your dashboard.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PORTALS.map(({ portal, path, title, description, badge }) => (
            <Link
              key={path}
              href={getPortalLoginPath(portal, path)}
              className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
            >
              <Card variant="default" hover className="h-full transition-all group-hover:border-primary/30 group-hover:-translate-y-0.5">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit rounded-full bg-primary/10 text-primary border-0">
                    {badge}
                  </Badge>
                  <CardTitle className="mt-4 group-hover:text-primary transition-colors">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-base-content/70 leading-relaxed">{description}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary rounded-full px-4 py-2 bg-primary/10 hover:bg-primary/20 transition-colors">
                    Sign in
                    <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
