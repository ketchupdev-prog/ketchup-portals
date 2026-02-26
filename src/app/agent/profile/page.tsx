'use client';

/**
 * Agent Profile – PRD §5.2.5.
 * Resolves agent_id from GET /api/v1/agents?limit=1, then loads profile from GET /api/v1/agents/[id].
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';

type Profile = {
  id: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  commission_rate: string | null;
  float_balance: string | null;
  status: string;
};

export default function AgentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/agents?limit=1')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return null;
        return json.data?.[0]?.id ?? null;
      })
      .then((id) => {
        if (cancelled || !id) return null;
        return fetch(`/api/v1/agents/${id}`);
      })
      .then((res) => (res && res.ok ? res.json() : Promise.resolve(null)))
      .then((json) => {
        if (cancelled) return;
        setProfile(json ?? null);
      })
      .catch(() => { if (!cancelled) setProfile(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Profile" description="Agent profile and account settings." />
        <p className="text-sm text-content-muted">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Profile" description="Agent profile and account settings." />
        <p className="text-sm text-content-muted">Profile not found. Sign in or use a valid agent ID.</p>
      </div>
    );
  }

  const items = [
    { term: 'Name', description: profile.name },
    { term: 'Address', description: profile.address ?? '—' },
    { term: 'Phone', description: profile.contact_phone ?? '—' },
    { term: 'Email', description: profile.contact_email ?? '—' },
    { term: 'Commission rate', description: profile.commission_rate != null ? `${profile.commission_rate}%` : '—' },
    { term: 'Float balance', description: profile.float_balance != null ? `NAD ${profile.float_balance}` : '—' },
    { term: 'Status', description: profile.status },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Agent profile and account settings (read-only until auth)." />
      <Card>
        <CardHeader><CardTitle>Agent details</CardTitle></CardHeader>
        <CardContent>
          <DescriptionList items={items} layout="stack" />
        </CardContent>
      </Card>
    </div>
  );
}
