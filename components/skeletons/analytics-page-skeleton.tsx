import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* 2 Big Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-44 rounded-md" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
        ))}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card/60 p-5 xl:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="flex h-56 items-end justify-between gap-3 px-2 pt-6">
            {[45, 70, 35, 85, 60, 95, 75, 90].map((h, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <Skeleton className="w-full rounded-t-md" style={{ height: `${h}%` }} />
                <Skeleton className="h-2.5 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-5">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-muted/50">
              <Skeleton className="h-14 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
