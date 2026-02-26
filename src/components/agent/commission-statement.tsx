'use client';

/**
 * CommissionStatement – Agent commission statement view / export. PRD §5.2.x.
 * Location: src/components/agent/commission-statement.tsx
 * Uses: Card, Button, DescriptionList.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DescriptionList } from '@/components/ui/description-list';

export interface CommissionStatementProps {
  period?: string;
  totalCashout?: string;
  totalFees?: string;
  transactionCount?: number;
  onDownloadCSV?: () => void;
  loading?: boolean;
  className?: string;
}

export function CommissionStatement({
  period,
  totalCashout = 'NAD 0',
  totalFees = 'NAD 0',
  transactionCount = 0,
  onDownloadCSV,
  loading = false,
  className = '',
}: CommissionStatementProps) {
  return (
    <Card className={className}>
      <CardHeader><CardTitle>Commission statement</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <DescriptionList
          items={[
            { term: 'Period', description: period ?? new Date().toISOString().slice(0, 10) },
            { term: 'Total cashout', description: totalCashout },
            { term: 'Total fees', description: totalFees },
            { term: 'Transaction count', description: String(transactionCount) },
          ]}
          layout="stack"
        />
        {onDownloadCSV && (
          <Button variant="outline" size="sm" onClick={onDownloadCSV} disabled={loading}>
            {loading ? 'Preparing…' : 'Download CSV'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
