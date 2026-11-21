import { Skeleton } from '@/components/ui/skeleton';

export function PendingPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      <div className="space-y-4">
        {/* Filter and Search Bar Skeleton */}
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border/40 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-9 w-full sm:max-w-xs rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-36 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Pending Table Skeleton */}
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
          <div className="border-b border-border/60 bg-muted/40 px-4 py-3 flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-16 rounded hidden sm:block" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded hidden md:block" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
          <div className="divide-y divide-border/40">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-md hidden sm:block" />
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-md hidden md:block" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-28 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
