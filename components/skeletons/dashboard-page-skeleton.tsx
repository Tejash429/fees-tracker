import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* KPI Stat Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-8 w-32 rounded-md" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Monthly Revenue Bar Chart Skeleton */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-5 xl:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-52 rounded" />
            </div>
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="pt-6">
            {/* Simulated bar chart columns */}
            <div className="flex h-56 items-end justify-between gap-3 px-2 pt-4">
              {[40, 65, 30, 80, 55, 90, 70, 85].map((heightPct, idx) => (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                  <Skeleton
                    className="w-full rounded-t-md"
                    style={{ height: `${heightPct}%` }}
                  />
                  <Skeleton className="h-2.5 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Class Breakdown Donut Skeleton */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-5">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            {/* Circular ring */}
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-muted/50">
              <Skeleton className="h-14 w-14 rounded-full" />
            </div>
            {/* Legend items */}
            <div className="mt-6 flex w-full justify-around border-t border-border/40 pt-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table Skeleton */}
      <div className="rounded-xl border border-border/70 bg-card/60">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="space-y-1">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-md hidden sm:block" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded hidden md:block" />
              <Skeleton className="h-8 w-12 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
