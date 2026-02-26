'use client';

/**
 * BeneficiarySmsHistoryTab – SMS history for a beneficiary (GET /api/v1/sms/history).
 * Location: src/components/ketchup/beneficiary-sms-history-tab.tsx
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

export interface BeneficiarySmsHistoryTabProps {
  beneficiaryId: string;
}

type SmsRow = {
  id: string;
  recipient_phone: string;
  message: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  error_message: string | null;
};

const COLS = [
  { key: 'created_at', header: 'Queued' },
  { key: 'status', header: 'Status' },
  { key: 'message', header: 'Message' },
  { key: 'sent_at', header: 'Sent' },
  { key: 'delivered_at', header: 'Delivered' },
];

function mapApiToRow(r: SmsRow): SmsRow & { created_at: string; sent_at: string; delivered_at: string } {
  return {
    ...r,
    created_at: r.created_at?.slice(0, 19).replace('T', ' ') ?? '—',
    sent_at: r.sent_at ? r.sent_at.slice(0, 19).replace('T', ' ') : '—',
    delivered_at: r.delivered_at ? r.delivered_at.slice(0, 19).replace('T', ' ') : '—',
  };
}

export function BeneficiarySmsHistoryTab({ beneficiaryId }: BeneficiarySmsHistoryTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<(SmsRow & { created_at: string; sent_at: string; delivered_at: string })[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/sms/history?beneficiary_id=${beneficiaryId}&page=1&limit=50`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setData(json.data.map(mapApiToRow));
        } else {
          setData([]);
        }
      })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [beneficiaryId]);

  return (
    <Card>
      <CardHeader><CardTitle>SMS history</CardTitle></CardHeader>
      <CardContent>
        <DataTable
          columns={COLS}
          data={data}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyMessage={loading ? 'Loading…' : 'No SMS sent for this beneficiary.'}
        />
      </CardContent>
    </Card>
  );
}
