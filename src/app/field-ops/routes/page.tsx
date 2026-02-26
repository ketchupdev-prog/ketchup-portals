'use client';

/**
 * Field Ops Route Planning – PRD §6.2.5.
 * Plan routes for technicians (stub; wire to GET /api/v1/field/route when implemented).
 */

import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent } from '@/components/ui/card';

export default function FieldOpsRoutesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Route planning"
        description="Plan and assign routes for field technicians. (Wire to API when route optimization is ready.)"
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-content-muted text-sm">
            Route planning will allow you to define daily routes, assign tasks to technicians, and optimize travel. This page will be wired to the field route API when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
