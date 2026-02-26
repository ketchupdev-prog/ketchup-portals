'use client';

/**
 * BeneficiaryDetail – Ketchup beneficiary detail view (info + tabs placeholder). PRD §3.2.2.
 * Composes description list and optional tabs; used by beneficiary detail page or client wrapper.
 * Location: src/components/ketchup/beneficiary-detail.tsx
 * Uses: Card, DescriptionList.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';

export interface BeneficiaryDetailData {
  id: string;
  name: string;
  phone: string;
  region: string;
  idNumber?: string;
  status: string;
}

export interface BeneficiaryDetailProps {
  beneficiary: BeneficiaryDetailData;
  children?: React.ReactNode;
  className?: string;
}

export function BeneficiaryDetail({ beneficiary, children, className = '' }: BeneficiaryDetailProps) {
  const items = [
    { term: 'Name', description: beneficiary.name },
    { term: 'Phone', description: beneficiary.phone },
    { term: 'Region', description: beneficiary.region },
    { term: 'ID Number', description: beneficiary.idNumber ?? '—' },
    { term: 'Status', description: beneficiary.status },
  ];

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <Card>
        <CardHeader><CardTitle>Beneficiary details</CardTitle></CardHeader>
        <CardContent>
          <DescriptionList items={items} layout="stack" />
        </CardContent>
      </Card>
      {children}
    </div>
  );
}
