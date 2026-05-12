import { Skeleton } from '@/components/ui/skeleton';

export function StudentsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-full md:max-w-sm" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-7 w-28" />
        </div>

        <Skeleton className="h-[420px] w-full" />
      </div>
    </div>
  );
}
