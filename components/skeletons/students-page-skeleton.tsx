import { Skeleton } from '@/components/ui/skeleton';

export function StudentsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Table Skeleton */}
      <div className="space-y-4">
        {/* Class Switcher Pills Skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Toolbar Skeleton */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-3 sm:p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:max-w-xs rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-36 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>

        {/* Table Container Skeleton */}
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
          <div className="border-b border-border/60 bg-muted/40 px-4 py-3 flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
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
                <Skeleton className="h-4 w-24 rounded hidden md:block" />
                <Skeleton className="h-4 w-20 rounded hidden md:block" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-14 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Pagination Skeleton */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Skeleton className="h-4 w-24 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
