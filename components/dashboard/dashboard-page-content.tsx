'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, ChevronRight, CreditCard, PieChart, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardPageSkeleton } from '@/components/skeletons/dashboard-page-skeleton';
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
        description="Real-time collection overview, dues summary, and recent transactions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline" className="h-9 gap-1.5 text-xs">
              <Link href="/payments">
                <CreditCard className="h-3.5 w-3.5" />
                All Payments
              </Link>
            </Button>
            <Button asChild size="sm" className="h-9 gap-1.5 text-xs">
              <Link href="/students">
                <Users className="h-3.5 w-3.5" />
                Students
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <StatCards stats={data.stats} />

      {/* Charts Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/70 bg-card/60 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
              <p className="text-xs text-muted-foreground">Fee collection trends over recent months</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.monthlyRevenue.some((item) => item.amount > 0) ? (
              <RevenueBarChart data={data.monthlyRevenue} />
            ) : (
              <EmptyState title="No revenue data" description="Record payments to populate monthly chart." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Class Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground">Revenue contribution by class</p>
            </div>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.classDonut.some((item) => item.value > 0) ? (
              <RevenueDonutChart data={data.classDonut} />
            ) : (
              <EmptyState
                title="No class revenue yet"
                description="Class distribution appears after the first payment."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Section */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
            <p className="text-xs text-muted-foreground">
              Last {data.recentPayments.length} recorded fee transactions
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/payments">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentPayments.length ? (
            <RecentPaymentsTable payments={data.recentPayments} />
          ) : (
            <EmptyState title="No payments yet" description="Recent transactions will appear here." />
          )}
        </CardContent>
      </Card>

      {/* Footer Sync Status */}
      <div className="flex items-center justify-end text-xs text-muted-foreground">
        {isFetching ? (
          <span role="status" aria-live="polite" className="mr-3">
            Syncing…
          </span>
        ) : null}
        <span>Last updated: {formatDateTime(dataUpdatedAt || Date.now())}</span>
      </div>
    </div>
  );
}
