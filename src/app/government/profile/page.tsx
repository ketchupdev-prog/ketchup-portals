'use client';

/**
 * Government Profile – Account view for Government portal users.
 * Uses GET /api/v1/portal/me; if 401 shows sign-in CTA, else PortalProfileView with session data.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalProfileView } from '@/components/profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';

const ROLE_LABELS: Record<string, string> = {
  gov_manager: 'Government manager',
  gov_auditor: 'Government auditor',
};

type Me = { id: string; email: string; full_name: string; role: string; agent_id: string | null; phone: string | null };

export default function GovernmentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null | 'unauthorized'>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/portal/me', { credentials: 'include' })
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 401) return 'unauthorized';
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setMe(data === 'unauthorized' ? 'unauthorized' : data);
      })
      .catch(() => { if (!cancelled) setMe('unauthorized'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Profile" description="Your Government portal account and settings." />
        <p className="text-sm text-content-muted">Loading…</p>
      </div>
    );
  }

  if (me === 'unauthorized') {
    return (
      <div className="space-y-6">
        <SectionHeader title="Profile" description="Your Government portal account and settings." />
        <Card>
          <CardContent className="pt-6">
            <p className="text-content-muted mb-4">Sign in to see your profile.</p>
            <Link href="/login"><Button>Sign in</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PortalProfileView
      title="Profile"
      description="Your Government portal account and settings."
      roleLabel={me ? (ROLE_LABELS[me.role] ?? me.role) : 'Government user'}
      name={me?.full_name}
      email={me?.email}
      settingsHref="/government/settings"
    />
  );
}
