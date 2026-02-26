import { DetailLayout } from '@/components/layout/detail-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DescriptionList } from '@/components/ui/description-list';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getUnit(id: string) {
  const isAtm = id.startsWith('a');
  if (isAtm) {
    return {
      id,
      type: 'ATM' as const,
      location: 'Windhoek Central',
      cashLevel: '85%',
      status: 'Online',
      lastReplenishment: '2025-02-20',
      maintenanceHistory: [{ date: '2025-02-01', action: 'Routine service' }],
    };
  }
  return {
    id,
    type: 'Mobile unit' as const,
    driver: 'Andreas N.',
    location: '-22.56, 17.08',
    lastActivity: '2025-02-22 14:00',
    nextMaintenance: '2025-03-01',
    status: 'Active',
    maintenanceHistory: [{ date: '2025-01-15', action: 'Inspection' }],
  };
}

export default async function MobileUnitDetailPage({ params }: PageProps) {
  const { id } = await params;
  const unit = await getUnit(id);

  const breadcrumbs = [
    { label: 'Mobile Units', href: '/ketchup/mobile-units' },
    { label: unit.type === 'ATM' ? (unit as { location: string }).location : (unit as { driver: string }).driver },
  ];

  const items = unit.type === 'ATM'
    ? [
        { term: 'Type', description: 'ATM' },
        { term: 'Location', description: (unit as { location: string }).location },
        { term: 'Cash level', description: (unit as { cashLevel: string }).cashLevel },
        { term: 'Status', description: (unit as { status: string }).status },
        { term: 'Last replenishment', description: (unit as { lastReplenishment: string }).lastReplenishment },
      ]
    : [
        { term: 'Type', description: 'Mobile unit' },
        { term: 'Driver', description: (unit as { driver: string }).driver },
        { term: 'Location', description: (unit as { location: string }).location },
        { term: 'Last activity', description: (unit as { lastActivity: string }).lastActivity },
        { term: 'Next maintenance', description: (unit as { nextMaintenance: string }).nextMaintenance },
        { term: 'Status', description: (unit as { status: string }).status },
      ];

  return (
    <DetailLayout
      breadcrumbs={breadcrumbs}
      title={unit.type === 'ATM' ? (unit as { location: string }).location : (unit as { driver: string }).driver}
      subtitle={unit.type}
      tabs={[
        {
          value: 'details',
          label: 'Details',
          content: (
            <Card>
              <CardHeader><CardTitle>Unit details</CardTitle></CardHeader>
              <CardContent>
                <DescriptionList items={items} layout="stack" />
              </CardContent>
            </Card>
          ),
        },
        {
          value: 'maintenance',
          label: 'Maintenance',
          content: (
            <Card>
              <CardHeader><CardTitle>Maintenance history</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {unit.maintenanceHistory.map((m: { date: string; action: string }, i: number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{m.date}</span>
                      <span>{m.action}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-content-muted mt-4">
                  Schedule maintenance creates a task for Field Ops.
                </p>
                <Link href="/field-ops/tasks" className="btn btn-outline btn-sm mt-2">
                  Create task
                </Link>
              </CardContent>
            </Card>
          ),
        },
      ]}
      defaultTab="details"
    />
  );
}
