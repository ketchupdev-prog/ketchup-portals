'use client';

/**
 * BeneficiaryProofOfLifeTab – Proof-of-life events (PRD §3.2.2 atom: method, timestamp, performed by).
 * Location: src/components/ketchup/beneficiary-proof-of-life-tab.tsx
 */

import { Timeline } from '@/components/ui/timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ProofOfLifeEvent {
  id: string;
  method: string;
  timestamp: string;
  performedBy: string;
}

interface BeneficiaryProofOfLifeTabProps {
  beneficiaryId: string;
  events: ProofOfLifeEvent[];
}

export function BeneficiaryProofOfLifeTab({ events }: BeneficiaryProofOfLifeTabProps) {
  const timelineItems = events.map((e) => ({
    title: e.method,
    time: e.timestamp,
    content: `Performed by ${e.performedBy}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proof of life</CardTitle>
        <p className="text-sm text-content-muted">Verification events (method, timestamp, performed by).</p>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-content-muted">No proof-of-life events recorded.</p>
        ) : (
          <Timeline items={timelineItems} />
        )}
      </CardContent>
    </Card>
  );
}
