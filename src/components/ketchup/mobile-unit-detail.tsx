'use client';

/**
 * MobileUnitDetail – Ketchup/Field Ops detail view for one mobile unit or ATM. PRD §3.2.5.
 * Location: src/components/ketchup/mobile-unit-detail.tsx
 * Uses: SectionHeader, Card, DescriptionList, Button.
 */

import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import { Button } from '@/components/ui/button';

export interface MobileUnitDetailProps {
  id: string;
  name: string;
  type: 'unit' | 'atm';
  status?: string;
  driver?: string;
  location?: string;
  cashLevel?: string;
  lastReplenishment?: string;
  onViewMap?: () => void;
  className?: string;
}

export function MobileUnitDetail({
  id,
  name,
  type,
  status = '—',
  driver = '—',
  location = '—',
  cashLevel,
  lastReplenishment = '—',
  onViewMap,
  className = '',
}: MobileUnitDetailProps) {
  const items = [
    { term: 'ID', description: id },
    { term: 'Name', description: name },
    { term: 'Type', description: type === 'atm' ? 'ATM' : 'Mobile unit' },
    { term: 'Status', description: status },
    { term: 'Driver', description: driver },
    { term: 'Location', description: location },
    ...(cashLevel != null ? [{ term: 'Cash level', description: cashLevel }] : []),
    { term: 'Last replenishment', description: lastReplenishment },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <SectionHeader title={name} description={`${type === 'atm' ? 'ATM' : 'Mobile unit'} · ${status}`} />
      <Card>
        <CardHeader><CardTitle>Unit details</CardTitle></CardHeader>
        <CardContent>
          <DescriptionList items={items} layout="stack" />
          {onViewMap && <Button size="sm" variant="outline" className="mt-4" onClick={onViewMap}>View on map</Button>}
        </CardContent>
      </Card>
    </div>
  );
}
