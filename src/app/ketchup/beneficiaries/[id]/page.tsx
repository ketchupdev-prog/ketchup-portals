import { notFound } from 'next/navigation';
import { DetailLayout } from '@/components/layout/detail-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import { BeneficiaryVouchersTab } from '@/components/ketchup/beneficiary-vouchers-tab';
import { BeneficiaryTransactionsTab } from '@/components/ketchup/beneficiary-transactions-tab';
import { BeneficiaryProofOfLifeTab } from '@/components/ketchup/beneficiary-proof-of-life-tab';
import { BeneficiarySmsHistoryTab } from '@/components/ketchup/beneficiary-sms-history-tab';
import { BeneficiaryAdvanceLedgerTab } from '@/components/ketchup/beneficiary-advance-ledger-tab';
import { BeneficiaryDetailActions } from '@/components/ketchup/beneficiary-detail-actions';
import { getBeneficiary, getBeneficiaryVouchers, getBeneficiaryTransactions, getProofOfLifeEvents } from '@/lib/data/beneficiary';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BeneficiaryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [beneficiary, vouchers, transactions, proofOfLifeEvents] = await Promise.all([
    getBeneficiary(id),
    getBeneficiaryVouchers(id),
    getBeneficiaryTransactions(id),
    getProofOfLifeEvents(id),
  ]);

  if (!beneficiary) notFound();

  const breadcrumbs = [
    { label: 'Beneficiaries', href: '/ketchup/beneficiaries' },
    { label: beneficiary.name },
  ];

  const tabs = [
    {
      value: 'info',
      label: 'Information',
      content: (
        <Card>
          <CardHeader><CardTitle>Beneficiary details</CardTitle></CardHeader>
          <CardContent>
            <DescriptionList
              items={[
                { term: 'Name', description: beneficiary.name },
                { term: 'Phone', description: beneficiary.phone },
                { term: 'Region', description: beneficiary.region },
                { term: 'ID Number', description: beneficiary.idNumber },
                { term: 'Status', description: beneficiary.status },
              ]}
              layout="stack"
            />
          </CardContent>
        </Card>
      ),
    },
    {
      value: 'vouchers',
      label: 'Vouchers',
      content: <BeneficiaryVouchersTab beneficiaryId={id} vouchers={vouchers} />,
    },
    {
      value: 'transactions',
      label: 'Transactions',
      content: <BeneficiaryTransactionsTab beneficiaryId={id} transactions={transactions} />,
    },
    {
      value: 'proof-of-life',
      label: 'Proof of Life',
      content: <BeneficiaryProofOfLifeTab beneficiaryId={id} events={proofOfLifeEvents} />,
    },
    {
      value: 'advance-ledger',
      label: 'Advance Ledger',
      content: <BeneficiaryAdvanceLedgerTab beneficiaryId={id} />,
    },
    {
      value: 'sms',
      label: 'SMS history',
      content: <BeneficiarySmsHistoryTab beneficiaryId={id} />,
    },
  ];

  return (
    <DetailLayout
      breadcrumbs={breadcrumbs}
      title={beneficiary.name}
      subtitle={`ID: ${beneficiary.id} · Phone: ${beneficiary.phone}`}
      tabs={tabs}
      defaultTab="info"
      actions={
        <BeneficiaryDetailActions
          beneficiaryId={id}
          beneficiaryName={beneficiary.name}
          status={beneficiary.status}
        />
      }
    />
  );
}
