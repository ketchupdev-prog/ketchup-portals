'use client';

/**
 * Beneficiary Platform Admin – App Analytics (PRD §3.2.9).
 * Uses AppAnalytics; data from GET /api/v1/analytics/dau, mau, channel-breakdown, redemption-rate, app-users.
 */

import { useState, useEffect } from 'react';
import { AppAnalytics, type AppUserRow } from '@/components/ketchup';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AppAnalyticsPage() {
  const [dau, setDau] = useState<string>('0');
  const [mau, setMau] = useState<string>('0');
  const [redemptionRate, setRedemptionRate] = useState<string>('0%');
  const [channelAppPercent, setChannelAppPercent] = useState(0);
  const [channelUssdPercent, setChannelUssdPercent] = useState(0);
  const [dauTrend, setDauTrend] = useState<{ name: string; value: number }[]>([]);
  const [channelData, setChannelData] = useState<{ name: string; value: number }[]>([]);
  const [appUsers, setAppUsers] = useState<AppUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/v1/analytics/dau?days=7', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/v1/analytics/mau?days=30', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/v1/analytics/redemption-rate', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/v1/analytics/channel-breakdown?days=30', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/v1/analytics/app-users?page=1&limit=100', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([dauRes, mauRes, redemptionRes, channelRes, usersRes]) => {
        if (cancelled) return;

        const dauArr = dauRes.data ?? [];
        const avgDau = dauArr.length > 0
          ? Math.round(dauArr.reduce((s: number, d: { count: number }) => s + d.count, 0) / dauArr.length)
          : 0;
        setDau(avgDau.toLocaleString());
        setMau((mauRes.mau ?? 0).toLocaleString());

        const rate = redemptionRes.redemption_rate_percent ?? 0;
        setRedemptionRate(typeof rate === 'number' ? `${rate}%` : `${rate}`);

        const ch = channelRes.data ?? [];
        const appCh = ch.find((c: { channel: string }) => c.channel === 'app');
        const ussdCh = ch.find((c: { channel: string }) => c.channel === 'ussd');
        const appPct = appCh?.percentage ?? 0;
        const ussdPct = ussdCh?.percentage ?? 0;
        setChannelAppPercent(appPct);
        setChannelUssdPercent(ussdPct);
        setChannelData([
          { name: 'App', value: appPct },
          { name: 'USSD', value: ussdPct },
        ]);

        const trend = dauArr.map((d: { date: string; count: number }) => {
          const day = new Date(d.date);
          return { name: DAY_NAMES[day.getDay()], value: d.count };
        });
        setDauTrend(trend.length > 0 ? trend : []);

        const list = usersRes.data ?? [];
        setAppUsers(list.map((u: { user_id: string; full_name: string | null; phone: string | null; login_at: string; device_os: string | null; app_version: string | null }) => ({
          id: u.user_id,
          email: u.phone ?? u.full_name ?? u.user_id,
          lastLogin: u.login_at ? new Date(u.login_at).toLocaleString() : '',
          deviceOs: u.device_os ?? '',
          appVersion: u.app_version ?? '',
        })));
      })
      .catch(() => { if (!cancelled) setAppUsers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  if (loading && appUsers.length === 0 && dauTrend.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-content-muted">Loading analytics…</p>
      </div>
    );
  }

  return (
    <AppAnalytics
      dau={dau}
      mau={mau}
      redemptionRate={redemptionRate}
      channelAppPercent={channelAppPercent}
      channelUssdPercent={channelUssdPercent}
      dauTrend={dauTrend.length > 0 ? dauTrend : undefined}
      channelData={channelData.length > 0 ? channelData : undefined}
      appUsers={appUsers}
    />
  );
}
