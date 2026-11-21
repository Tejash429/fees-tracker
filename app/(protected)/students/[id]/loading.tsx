import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDetailsLoading() {
  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-4 w-40 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-7 w-28 rounded-md" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid: Info & Payments Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Student Information Card */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="space-y-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Payment History Card */}
        <div className="rounded-xl border border-border/70 bg-card/60 lg:col-span-2">
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="divide-y divide-border/40">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-20 rounded hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-8 w-8 rounded-md" />
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
