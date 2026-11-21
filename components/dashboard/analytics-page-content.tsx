'use client';

import Link from 'next/link';
import {
  BarChart3,
  CreditCard,
  GraduationCap,
  LineChart,
  PieChart,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CumulativeLineChart } from '@/components/dashboard/cumulative-line-chart';
import { RevenueBarChart } from '@/components/dashboard/revenue-bar-chart';
import { RevenueDonutChart } from '@/components/dashboard/revenue-donut-chart';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticsPageSkeleton } from '@/components/skeletons/analytics-page-skeleton';
import { Button } from '@/components/ui/button';
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

  const totalRevenue = (data.classRevenue['9'] || 0) + (data.classRevenue['10'] || 0);
  const class9Share = totalRevenue > 0 ? ((data.classRevenue['9'] / totalRevenue) * 100).toFixed(1) : '0';
  const class10Share = totalRevenue > 0 ? ((data.classRevenue['10'] / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Detailed revenue distribution, monthly growth velocity, and class-wise share."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="h-9 gap-1.5 text-xs">
              <Link href="/payments">
                <CreditCard className="h-3.5 w-3.5" />
                Ledger
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-9 gap-1.5 text-xs">
              <Link href="/pending">
                <Wallet className="h-3.5 w-3.5" />
                Pending Dues
              </Link>
            </Button>
          </div>
        }
      />

      {/* Class Revenue Breakdown Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Class 9 */}
        <div className="relative overflow-hidden rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-card/70 to-card/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-sky-400">
              Class 9 Collection
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {formatCurrency(data.classRevenue['9'])}
              </p>
              <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-400">
                {class9Share}% of total
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total fees collected from 9th grade students
            </p>
          </div>
        </div>

        {/* Class 10 */}
        <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-card/70 to-card/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-violet-400">
              Class 10 Collection
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {formatCurrency(data.classRevenue['10'])}
              </p>
              <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-400">
                {class10Share}% of total
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total fees collected from 10th grade students
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/70 bg-card/60 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Monthly Inflow</CardTitle>
              <p className="text-xs text-muted-foreground">Month-by-month revenue inflow</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.monthlyRevenue.some((item) => item.amount > 0) ? (
              <RevenueBarChart data={data.monthlyRevenue} />
            ) : (
              <EmptyState title="No analytics data" description="Monthly chart will appear after payments." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Plan Type Split</CardTitle>
              <p className="text-xs text-muted-foreground">Yearly vs Half-Yearly plan adoption</p>
            </div>
            <PieChart className="h-4 w-4 text-muted-foreground" />
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

      {/* Cumulative Line Chart */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Cumulative Growth</CardTitle>
            <p className="text-xs text-muted-foreground">Cumulative cash flow trajectory over time</p>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.cumulativeCollection.some((item) => item.amount > 0) ? (
            <CumulativeLineChart data={data.cumulativeCollection} />
          ) : (
            <EmptyState
              title="No cumulative trend yet"
              description="Collection trajectory appears after payments are recorded."
            />
          )}
        </CardContent>
      </Card>

      {/* Footer Status */}
      <div className="flex items-center justify-end text-xs text-muted-foreground">
        {isFetching && (
          <span role="status" aria-live="polite" className="mr-3">
            Syncing…
          </span>
        )}
        <span>Last updated: {formatDateTime(dataUpdatedAt || Date.now())}</span>
      </div>
    </div>
  );
}
