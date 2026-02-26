'use client';

/**
 * LandingOverview – Overview / value proposition section for the landing page.
 * Purpose: Explain what Ketchup SmartPay is, who it serves, key benefits. Modular landing section.
 * Location: src/components/landing/LandingOverview.tsx
 * Uses: Container, Card (CardHeader, CardTitle, CardContent).
 */

import { Container } from '@/components/ui/container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const FEATURES = [
  {
    title: 'Operations & compliance',
    description: 'Manage beneficiaries, vouchers, agents, and reconciliation in one place. Full audit trails and compliance monitoring.',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Government oversight',
    description: 'Programme dashboards, unverified beneficiary reports, voucher monitoring, and export-ready reports for auditors.',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: 'Agent network',
    description: 'Float management, transaction history, parcel tracking, and settlement statements for agents and merchants.',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4-1V7a2 2 0 012-2h2a2 2 0 012 2v1m-4 4h4" />
      </svg>
    ),
  },
  {
    title: 'Field operations',
    description: 'Map view of units and locations, task assignment, activity logs, and route planning for field teams.',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function LandingOverview() {
  return (
    <section id="overview" className="py-16 sm:py-24 bg-base-100">
      <Container size="lg">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-bold text-base-content sm:text-4xl">
            One platform. Four portals. Full control.
          </h2>
          <p className="mt-4 text-lg text-base-content/80">
            Ketchup SmartPay is the G2P orchestration layer for Namibia: vouchers, beneficiaries, agents, compliance, and field operations in a single, secure application.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ title, description, icon }) => (
            <Card key={title} variant="default" hover className="h-full">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  {icon}
                </div>
                <CardTitle className="mt-4">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-base-content/70 leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
