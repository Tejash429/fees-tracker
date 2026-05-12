import { AlertTriangle, IndianRupee, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/types';
import { formatCurrency } from '@/lib/utils';

function formatDelta(delta: number) {
  if (!Number.isFinite(delta)) return '0%';
  return `${Math.abs(delta).toFixed(1)}%`;
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  const isGrowth = stats.thisMonthDeltaPct >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="md:col-span-2 xl:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{formatCurrency(stats.totalCollected)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Lifetime collection across all recorded payments.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatCurrency(stats.thisMonthCollection)}</p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            {isGrowth ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
            <span className={isGrowth ? 'text-emerald-300' : 'text-rose-300'}>{formatDelta(stats.thisMonthDeltaPct)}</span>
            <span className="text-muted-foreground">vs last month ({formatCurrency(stats.previousMonthCollection)})</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{stats.totalStudents}</p>
          <p className="mt-1 text-xs text-muted-foreground">Currently enrolled active student records.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Dues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatCurrency(stats.pendingDues)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.pendingStudentsCount} students currently pending</p>
        </CardContent>
      </Card>
    </div>
  );
}
