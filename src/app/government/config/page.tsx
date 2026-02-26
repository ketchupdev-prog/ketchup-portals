'use client';

/**
 * Government – Configuration (admin only). PRD §4.2.5.
 * Programme and verification defaults; link to Programmes for per-programme settings.
 */

import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GovernmentConfigPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Configuration"
        description="Programme and verification settings (gov_admin only)."
      />
      <Card>
        <CardHeader><CardTitle>Programme defaults</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-content-muted text-sm">
            Set verification frequency, cycle length, and other defaults per programme. Use the Programmes page to create or edit programmes and their verification settings.
          </p>
          <Link href="/government/programmes">
            <Button variant="outline" size="sm">Open Programmes</Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Audit & reporting</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-content-muted text-sm">
            Generate audit exports and reports from the Reports page. Configure report schedules and delivery when the feature is available.
          </p>
          <Link href="/government/reports">
            <Button variant="outline" size="sm">Open Reports</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
