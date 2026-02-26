'use client';

/**
 * NotificationPreferencesForm – Load/save notification_preferences via GET/PATCH /api/v1/portal/user/preferences.
 * Renders toggles per portal per spec §8.3 (PROFILE_AND_SETTINGS.md). Used on Agent, Ketchup, Government, Field Ops settings.
 * Location: src/components/profile/notification-preferences-form.tsx
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export type PortalSlug = 'agent' | 'ketchup' | 'government' | 'field-ops';

type ChannelPrefs = { in_app?: boolean; email?: boolean; sms?: boolean };
export type NotificationPreferences = Record<string, ChannelPrefs | string>;

const DEFAULTS: ChannelPrefs = { in_app: true, email: false, sms: false };

const PORTAL_CONFIG: Record<
  PortalSlug,
  { key: string; label: string; channels: ('in_app' | 'email' | 'sms')[] }[]
> = {
  agent: [
    { key: 'agent_low_float', label: 'Low float alert', channels: ['in_app', 'email', 'sms'] },
    { key: 'agent_float_request_approved', label: 'Float request approved', channels: ['in_app', 'email', 'sms'] },
    { key: 'agent_float_request_rejected', label: 'Float request rejected', channels: ['in_app', 'email', 'sms'] },
    { key: 'agent_parcel_ready', label: 'Parcel ready for collection', channels: ['in_app', 'email', 'sms'] },
  ],
  ketchup: [
    { key: 'ketchup_duplicate_detected', label: 'New duplicate detected', channels: ['in_app', 'email'] },
    { key: 'ketchup_high_value_adjustment', label: 'High-value adjustment', channels: ['in_app', 'email'] },
  ],
  government: [
    { key: 'gov_report_ready', label: 'Report ready (e.g. PDF)', channels: ['in_app', 'email'] },
    { key: 'gov_duplicate_alert', label: 'Duplicate redemption supervisor alert', channels: ['in_app', 'email'] },
  ],
  'field-ops': [
    { key: 'field_task_assigned', label: 'Task assigned', channels: ['in_app', 'email', 'sms'] },
    { key: 'field_route_updated', label: 'Route updated', channels: ['in_app', 'email', 'sms'] },
  ],
};

export interface NotificationPreferencesFormProps {
  portal: PortalSlug;
  /** If true, render inside a Card (e.g. Agent settings). If false, caller wraps (e.g. PortalSettingsView). */
  wrapped?: boolean;
}

function getDefaultPrefs(portal: PortalSlug): NotificationPreferences {
  const prefs: NotificationPreferences = {};
  for (const { key } of PORTAL_CONFIG[portal]) {
    prefs[key] = { ...DEFAULTS };
  }
  if (portal === 'ketchup') (prefs as Record<string, string>)['email_digest'] = 'off';
  if (portal === 'government') {
    (prefs as Record<string, string>)['report_delivery_frequency'] = 'off';
    (prefs as Record<string, string>)['report_delivery_format'] = 'pdf';
  }
  return prefs;
}

function mergeWithDefaults(portal: PortalSlug, data: NotificationPreferences): NotificationPreferences {
  const out = getDefaultPrefs(portal);
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'object' && v !== null) {
      out[k] = { ...DEFAULTS, ...v };
    } else if (typeof v === 'string') {
      (out as Record<string, string>)[k] = v;
    }
  }
  return out;
}

export function NotificationPreferencesForm({ portal, wrapped = true }: NotificationPreferencesFormProps) {
  const { addToast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => getDefaultPrefs(portal));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/portal/user/preferences', { credentials: 'include' });
        if (!res.ok) {
          setPrefs(getDefaultPrefs(portal));
          return;
        }
        const json = await res.json();
        const raw = json?.data?.notification_preferences;
        if (!cancelled && raw && typeof raw === 'object') {
          setPrefs(mergeWithDefaults(portal, raw));
        } else if (!cancelled) {
          setPrefs(getDefaultPrefs(portal));
        }
      } catch {
        if (!cancelled) setPrefs(getDefaultPrefs(portal));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [portal]);

  const updateChannel = (key: string, channel: 'in_app' | 'email' | 'sms', value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev };
      const current = next[key];
      if (typeof current === 'object' && current !== null) {
        next[key] = { ...current, [channel]: value };
      } else {
        next[key] = { ...DEFAULTS, [channel]: value };
      }
      return next;
    });
  };

  const updateStringPref = (key: string, value: string) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/portal/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_preferences: prefs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast(data.error ?? 'Failed to save preferences', 'error');
        return;
      }
      addToast('Preferences saved.', 'success');
    } catch {
      addToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const config = PORTAL_CONFIG[portal];
  const content = (
    <>
      <div className="space-y-4">
        {config.map(({ key, label, channels }) => (
          <div key={key} className="flex flex-wrap items-center gap-4 border-b border-base-300 pb-3 last:border-0">
            <span className="font-medium min-w-48">{label}</span>
            {channels.map((ch) => {
              const val = prefs[key];
              const on = typeof val === 'object' && val !== null ? (val as ChannelPrefs)[ch] ?? (ch === 'in_app') : false;
              return (
                <Switch
                  key={ch}
                  label={ch === 'in_app' ? 'In-app' : ch === 'email' ? 'Email' : 'SMS'}
                  checked={!!on}
                  onChange={(e) => updateChannel(key, ch, e.target.checked)}
                  disabled={loading}
                />
              );
            })}
          </div>
        ))}
        {portal === 'ketchup' && (
          <div className="flex flex-wrap items-center gap-4 border-b border-base-300 pb-3">
            <span className="font-medium min-w-48">Daily email digest</span>
            <select
              className="select select-bordered select-sm"
              value={(prefs as Record<string, string>)['email_digest'] ?? 'off'}
              onChange={(e) => updateStringPref('email_digest', e.target.value)}
              disabled={loading}
            >
              <option value="off">Off</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        )}
        {portal === 'government' && (
          <>
            <div className="flex flex-wrap items-center gap-4 border-b border-base-300 pb-3">
              <span className="font-medium min-w-48">Report delivery frequency</span>
              <select
                className="select select-bordered select-sm"
                value={(prefs as Record<string, string>)['report_delivery_frequency'] ?? 'off'}
                onChange={(e) => updateStringPref('report_delivery_frequency', e.target.value)}
                disabled={loading}
              >
                <option value="off">Off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-b border-base-300 pb-3">
              <span className="font-medium min-w-48">Report format</span>
              <select
                className="select select-bordered select-sm"
                value={(prefs as Record<string, string>)['report_delivery_format'] ?? 'pdf'}
                onChange={(e) => updateStringPref('report_delivery_format', e.target.value)}
                disabled={loading}
              >
                <option value="pdf">PDF</option>
              </select>
            </div>
          </>
        )}
      </div>
      <Button className="mt-4" onClick={handleSave} disabled={loading || saving}>
        {saving ? 'Saving…' : 'Save preferences'}
      </Button>
    </>
  );

  if (wrapped) {
    return (
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-content-muted">Loading preferences…</p>
          ) : (
            content
          )}
        </CardContent>
      </Card>
    );
  }
  return loading ? <p className="text-sm text-content-muted">Loading preferences…</p> : content;
}
