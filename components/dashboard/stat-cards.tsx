'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  IndianRupee,
  Users,
  Wallet
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardStats } from '@/types';
import { formatCurrency } from '@/lib/utils';

function formatDelta(delta: number) {
  if (!Number.isFinite(delta)) return '0%';
  return `${Math.abs(delta).toFixed(1)}%`;
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  const isGrowth = stats.thisMonthDeltaPct >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Collected */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-card/70 to-card/50 p-4 shadow-xs transition-all hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
            Total Collected
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {formatCurrency(stats.totalCollected)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Lifetime collections recorded
          </p>
        </div>
      </div>

      {/* 2. This Month */}
      <div className="relative overflow-hidden rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-card/70 to-card/50 p-4 shadow-xs transition-all hover:border-sky-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-sky-400">
            This Month
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
            <IndianRupee className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {formatCurrency(stats.thisMonthCollection)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                isGrowth
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {isGrowth ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {formatDelta(stats.thisMonthDeltaPct)}
            </span>
            <span className="text-muted-foreground truncate">
              vs last mo ({formatCurrency(stats.previousMonthCollection)})
            </span>
          </div>
        </div>
      </div>

      {/* 3. Total Students */}
      <Link
        href="/students"
        className="group relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-card/70 to-card/50 p-4 shadow-xs transition-all hover:border-violet-500/40"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-violet-400">
            Active Students
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {stats.totalStudents}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-violet-300">
              Manage <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enrolled in Classes 9 & 10
          </p>
        </div>
      </Link>

      {/* 4. Pending Dues */}
      <Link
        href="/pending"
        className="group relative overflow-hidden rounded-xl border border-rose-500/25 bg-gradient-to-br from-rose-950/20 via-card/70 to-card/50 p-4 shadow-xs transition-all hover:border-rose-500/50"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-rose-400">
            Pending Dues
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {formatCurrency(stats.pendingDues)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-rose-400 group-hover:underline">
              View dues <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <p className="mt-1 text-xs text-rose-300/80 font-medium">
            {stats.pendingStudentsCount} students currently due
          </p>
        </div>
      </Link>
    </div>
  );
}
