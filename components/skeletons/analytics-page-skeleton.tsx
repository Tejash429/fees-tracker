import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-[360px] w-full xl:col-span-2" />
        <Skeleton className="h-[360px] w-full" />
      </div>

      <Skeleton className="h-[320px] w-full" />
    </div>
  );
}
