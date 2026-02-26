import { DetailLayout } from '@/components/layout/detail-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getVoucher(id: string) {
  return {
    id,
    code: `VCH-${id.padStart(3, '0')}`,
    amount: 'NAD 500',
    programme: 'Programme 1',
    beneficiaryName: 'John Doe',
    beneficiaryId: '1',
    status: 'Redeemed',
    issuedAt: '2025-01-10',
    expiry: '2025-02-10',
    redeemedAt: '2025-01-12',
    redemptionMethod: 'Mobile app',
    loanRepayment: null as string | null,
  };
}

export default async function VoucherDetailPage({ params }: PageProps) {
  const { id } = await params;
  const voucher = await getVoucher(id);

  const breadcrumbs = [
    { label: 'Vouchers', href: '/ketchup/vouchers' },
    { label: voucher.code },
  ];

  const items = [
    { term: 'Voucher ID', description: voucher.code },
    { term: 'Amount', description: voucher.amount },
    { term: 'Programme', description: voucher.programme },
    { term: 'Beneficiary', description: <Link href={`/ketchup/beneficiaries/${voucher.beneficiaryId}`} className="link link-primary">{voucher.beneficiaryName}</Link> },
    { term: 'Status', description: voucher.status },
    { term: 'Issued', description: voucher.issuedAt },
    { term: 'Expiry', description: voucher.expiry },
    ...(voucher.redeemedAt ? [{ term: 'Redeemed', description: voucher.redeemedAt }, { term: 'Method', description: voucher.redemptionMethod }] : []),
    ...(voucher.loanRepayment ? [{ term: 'Loan repayment', description: voucher.loanRepayment }] : []),
  ];

  return (
    <DetailLayout
      breadcrumbs={breadcrumbs}
      title={voucher.code}
      subtitle={`${voucher.amount} · ${voucher.status}`}
      tabs={[
        {
          value: 'lifecycle',
          label: 'Lifecycle',
          content: (
            <Card>
              <CardHeader><CardTitle>Voucher details</CardTitle></CardHeader>
              <CardContent>
                <DescriptionList items={items} layout="stack" />
              </CardContent>
            </Card>
          ),
        },
      ]}
      defaultTab="lifecycle"
    />
  );
}
