'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export function RecentActivity() {
  const activities: { id: string; title: string; time: string; type: string }[] = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Activity will appear here as it happens."
          />
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex justify-between items-center py-2 border-b border-base-300 last:border-0"
              >
                <span className="font-medium">{a.title}</span>
                <span className="text-sm text-content-muted">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
