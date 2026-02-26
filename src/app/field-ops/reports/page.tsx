'use client';

/**
 * Field Ops Reports – PRD §6.2.6.
 * Activity and performance reports (stub; link to activity and future report types).
 */

import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FieldOpsReportsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        description="Activity and performance reports for field operations."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><h3 className="font-semibold">Activity report</h3></CardHeader>
          <CardContent>
            <p className="text-sm text-content-muted mb-3">Tasks completed, maintenance logs, and assets visited by date range.</p>
            <Link href="/field-ops/activity"><Button size="sm" variant="outline">Open activity</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><h3 className="font-semibold">Performance reports</h3></CardHeader>
          <CardContent>
            <p className="text-sm text-content-muted">Technician and asset performance metrics. (Coming soon.)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
