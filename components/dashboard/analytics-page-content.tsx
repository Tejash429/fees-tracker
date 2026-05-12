'use client';

import { useQuery } from '@tanstack/react-query';
import { CumulativeLineChart } from '@/components/dashboard/cumulative-line-chart';
import { RevenueBarChart } from '@/components/dashboard/revenue-bar-chart';
import { RevenueDonutChart } from '@/components/dashboard/revenue-donut-chart';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticsPageSkeleton } from '@/components/skeletons/analytics-page-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalyticsDataClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { AnalyticsData } from '@/types';

export function AnalyticsPageContent({ initialData }: { initialData: AnalyticsData }) {
  const { data, isFetching, isPending, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: fetchAnalyticsDataClient,
    initialData
  });

  if (isPending && !data) {
    return <AnalyticsPageSkeleton />;
  }

  if (!data) {
    return <EmptyState title="Could not load analytics" description="Please try again." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Detailed revenue insights by month, payment type, and class."
        actions={
          <div className="text-left md:text-right">
            <p className="text-xs text-muted-foreground">Last updated: {formatDateTime(dataUpdatedAt || Date.now())}</p>
            {isFetching ? (
              <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                Updating analytics…
              </p>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Class 9 Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(data.classRevenue['9'])}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class 10 Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(data.classRevenue['10'])}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyRevenue.some((item) => item.amount > 0) ? (
              <RevenueBarChart data={data.monthlyRevenue} />
            ) : (
              <EmptyState title="No analytics data" description="Monthly chart will appear after payments." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Type Split</CardTitle>
          </CardHeader>
          <CardContent>
            {data.paymentTypeDonut.some((item) => item.value > 0) ? (
              <RevenueDonutChart data={data.paymentTypeDonut} />
            ) : (
              <EmptyState title="No type split yet" description="Donut chart appears after payments." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cumulative Collection</CardTitle>
        </CardHeader>
        <CardContent>
          {data.cumulativeCollection.some((item) => item.amount > 0) ? (
            <CumulativeLineChart data={data.cumulativeCollection} />
          ) : (
            <EmptyState
              title="No cumulative trend yet"
              description="Collection trend appears after payment data is available."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
