'use client';

/**
 * Agent Profile – PRD §5.2.5.
 * Uses GET /api/v1/portal/me for session; if 401 shows sign-in CTA. Else shows Account + Agent details from GET /api/v1/agents/[id] (me.agent_id).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import { Button } from '@/components/ui/button';

type Me = { id: string; email: string; full_name: string; role: string; agent_id: string | null; phone: string | null };
type AgentProfile = {
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
  const [me, setMe] = useState<Me | null | 'unauthorized'>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/portal/me', { credentials: 'include' })
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 401) return 'unauthorized';
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data === 'unauthorized') {
          setMe('unauthorized');
          setAgentProfile(null);
          return;
        }
        setMe(data);
        const agentId = data?.agent_id ?? null;
        if (!agentId) {
          setAgentProfile(null);
          return;
        }
        return fetch(`/api/v1/agents/${agentId}`, { credentials: 'include' });
      })
      .then((res) => {
        if (cancelled || !res) return null;
        return res.ok ? res.json() : null;
      })
      .then((json) => {
        if (!cancelled) setAgentProfile(json ?? null);
      })
      .catch(() => { if (!cancelled) setMe('unauthorized'); })
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

  if (me === 'unauthorized') {
    return (
      <div className="space-y-6">
        <SectionHeader title="Profile" description="Agent profile and account settings." />
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
    <div className="space-y-6">
      <SectionHeader
        title="Profile"
        description="Agent profile and account settings."
        action={
          <Link href="/agent/settings"><Button variant="ghost" size="sm">Change password</Button></Link>
        }
      />

      {me && (
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent>
            <DescriptionList
              items={[
                { term: 'Name', description: me.full_name },
                { term: 'Email', description: me.email },
              ]}
              layout="stack"
            />
          </CardContent>
        </Card>
      )}

      {!me?.agent_id && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-content-muted">No agent linked. Contact Ketchup to link your account.</p>
          </CardContent>
        </Card>
      )}

      {agentProfile && (
        <Card>
          <CardHeader><CardTitle>Agent details</CardTitle></CardHeader>
          <CardContent>
            <DescriptionList
              items={[
                { term: 'Name', description: agentProfile.name },
                { term: 'Address', description: agentProfile.address ?? '—' },
                { term: 'Phone', description: agentProfile.contact_phone ?? '—' },
                { term: 'Email', description: agentProfile.contact_email ?? '—' },
                { term: 'Commission rate', description: agentProfile.commission_rate != null ? `${agentProfile.commission_rate}%` : '—' },
                { term: 'Float balance', description: agentProfile.float_balance != null ? `NAD ${agentProfile.float_balance}` : '—' },
                { term: 'Status', description: agentProfile.status },
              ]}
              layout="stack"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
