'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardPageSkeleton } from '@/components/skeletons/dashboard-page-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentPaymentsTable } from '@/components/dashboard/recent-payments-table';
import { RevenueBarChart } from '@/components/dashboard/revenue-bar-chart';
import { RevenueDonutChart } from '@/components/dashboard/revenue-donut-chart';
import { StatCards } from '@/components/dashboard/stat-cards';
import { fetchDashboardDataClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime } from '@/lib/utils';
import { DashboardData } from '@/types';

export function DashboardPageContent({ initialData }: { initialData: DashboardData }) {
  const { data, isFetching, isPending, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboardDataClient,
    initialData
  });

  if (isPending && !data) {
    return <DashboardPageSkeleton />;
  }

  if (!data) {
    return <EmptyState title="Could not load dashboard" description="Please try again." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of collections, dues, and recent transactions."
        actions={
          <div className="text-left md:text-right">
            <p className="text-xs text-muted-foreground">Last updated: {formatDateTime(dataUpdatedAt || Date.now())}</p>
            {isFetching ? (
              <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                Updating dashboard…
              </p>
            ) : null}
          </div>
        }
      />

      <StatCards stats={data.stats} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyRevenue.some((item) => item.amount > 0) ? (
              <RevenueBarChart data={data.monthlyRevenue} />
            ) : (
              <EmptyState title="No revenue data" description="Record payments to populate monthly chart." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class-wise Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {data.classDonut.some((item) => item.value > 0) ? (
              <RevenueDonutChart data={data.classDonut} />
            ) : (
              <EmptyState
                title="No class revenue yet"
                description="Class distribution appears after first payment."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentPayments.length ? (
            <RecentPaymentsTable payments={data.recentPayments} />
          ) : (
            <EmptyState title="No payments yet" description="Recent transactions will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
