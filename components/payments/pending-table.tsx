'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Phone,
  Plus,
  Search,
  User,
  Users,
  X
} from 'lucide-react';

import { exportToExcel } from '@/lib/export';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { OverflowMenu } from '@/components/shared/overflow-menu';
import { RecordPaymentDialog } from '@/components/payments/record-payment-dialog';
import { fetchPendingStudentsClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getAvatarColor,
  getInitials,
  sanitizePhone
} from '@/lib/utils';
import { PendingStudent, StudentClass } from '@/types';

type SortField = 'dueAmount' | 'name' | 'class' | 'latestPayment';
type SortOrder = 'asc' | 'desc';

function PendingTableSkeleton() {
  return (
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
  );
}

export function PendingTable({ initialPendingRows }: { initialPendingRows: PendingStudent[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('q') || '';
  const initialClassFilter =
    searchParams.get('class') === '9' || searchParams.get('class') === '10'
      ? (searchParams.get('class') as StudentClass)
      : 'all';
  const initialStatusFilter =
    searchParams.get('status') === 'never_paid' || searchParams.get('status') === 'overdue'
      ? (searchParams.get('status') as 'never_paid' | 'overdue')
      : 'all';

  const [search, setSearch] = useState(initialSearch);
  const [classFilter, setClassFilter] = useState<'all' | StudentClass>(initialClassFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'never_paid' | 'overdue'>(initialStatusFilter);
  const [sortField, setSortField] = useState<SortField>('dueAmount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const updateFiltersInUrl = (
    nextSearch: string,
    nextClassFilter: 'all' | StudentClass,
    nextStatusFilter: 'all' | 'never_paid' | 'overdue'
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSearch.trim()) {
      params.set('q', nextSearch.trim());
    } else {
      params.delete('q');
    }

    if (nextClassFilter !== 'all') {
      params.set('class', nextClassFilter);
    } else {
      params.delete('class');
    }

    if (nextStatusFilter !== 'all') {
      params.set('status', nextStatusFilter);
    } else {
      params.delete('status');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const {
    data: pendingRows = initialPendingRows,
    isPending,
    isFetching,
    dataUpdatedAt
  } = useQuery({
    queryKey: queryKeys.pending,
    queryFn: fetchPendingStudentsClient,
    initialData: initialPendingRows
  });

  // Calculate live statistics
  const stats = useMemo(() => {
    const totalDue = pendingRows.reduce((sum, r) => sum + (r.dueAmount || 0), 0);
    const count = pendingRows.length;
    const neverPaidCount = pendingRows.filter((r) => r.dueStatus === 'never_paid').length;
    const overdueCount = pendingRows.filter((r) => r.dueStatus === 'overdue').length;
    const class9Count = pendingRows.filter((r) => r.student.class === '9').length;
    const class10Count = pendingRows.filter((r) => r.student.class === '10').length;

    return {
      totalDue,
      count,
      neverPaidCount,
      overdueCount,
      class9Count,
      class10Count
    };
  }, [pendingRows]);

  // Filtered and sorted rows
  const filteredRows = useMemo(() => {
    const searchLower = search.trim().toLowerCase();

    const filtered = pendingRows.filter((row) => {
      const classMatches = classFilter === 'all' || row.student.class === classFilter;
      const statusMatches = statusFilter === 'all' || row.dueStatus === statusFilter;
      const searchMatches =
        !searchLower ||
        row.student.name.toLowerCase().includes(searchLower) ||
        Boolean(row.student.phone && row.student.phone.toLowerCase().includes(searchLower));

      return classMatches && statusMatches && searchMatches;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'dueAmount') {
        comparison = (a.dueAmount || 0) - (b.dueAmount || 0);
      } else if (sortField === 'name') {
        comparison = a.student.name.localeCompare(b.student.name);
      } else if (sortField === 'class') {
        comparison = a.student.class.localeCompare(b.student.class);
      } else if (sortField === 'latestPayment') {
        const dateA = a.latestPayment ? new Date(a.latestPayment.period_end).getTime() : 0;
        const dateB = b.latestPayment ? new Date(b.latestPayment.period_end).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [pendingRows, classFilter, statusFilter, search, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    const exportRows = filteredRows.map((r) => ({
      'Student Name': r.student.name,
      'Class': `Class ${r.student.class}`,
      'Phone': r.student.phone || '—',
      'Due Status': r.dueStatus === 'never_paid' ? 'Never Paid' : 'Overdue',
      'Due Amount (INR)': r.dueAmount,
      'Last Payment Date': r.latestPayment?.payment_date ? formatDate(r.latestPayment.payment_date) : 'None',
      'Coverage End Date': r.latestPayment?.period_end ? formatDate(r.latestPayment.period_end) : 'None'
    }));
    exportToExcel(exportRows, `Pending_Dues_${new Date().toISOString().split('T')[0]}`);
  };

  const clearAllFilters = () => {
    setSearch('');
    setClassFilter('all');
    setStatusFilter('all');
    updateFiltersInUrl('', 'all', 'all');
  };

  const hasActiveFilters = search.trim() !== '' || classFilter !== 'all' || statusFilter !== 'all';

  if (isPending && !pendingRows.length) {
    return <PendingTableSkeleton />;
  }

  if (!pendingRows.length) {
    return (
      <EmptyState
        title="No pending dues"
        description="Great! All active students are fully covered by active payment periods."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:p-4">
        {/* Quick Tabs: Status & Class */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                updateFiltersInUrl(search, classFilter, 'all');
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              All Dues ({stats.count})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('never_paid');
                updateFiltersInUrl(search, classFilter, 'never_paid');
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === 'never_paid'
                  ? 'bg-amber-500 text-amber-950 shadow-xs'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Never Paid ({stats.neverPaidCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('overdue');
                updateFiltersInUrl(search, classFilter, 'overdue');
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === 'overdue'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Overdue ({stats.overdueCount})
            </button>
          </div>

          {/* Class Filters */}
          <div className="flex items-center gap-1.5 border-t border-border/40 pt-2 sm:border-t-0 sm:pt-0">
            <span className="text-[11px] font-medium text-muted-foreground">Class:</span>
            {(['all', '9', '10'] as const).map((cls) => {
              const isActive = classFilter === cls;
              const count =
                cls === 'all' ? stats.count : cls === '9' ? stats.class9Count : stats.class10Count;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    setClassFilter(cls);
                    updateFiltersInUrl(search, cls, statusFilter);
                  }}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-muted text-foreground ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  {cls === 'all' ? 'All' : `Class ${cls}`} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Sort, Export Toolbar */}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by student name or phone..."
              value={search}
              onChange={(e) => {
                const nextSearch = e.target.value;
                setSearch(nextSearch);
                updateFiltersInUrl(nextSearch, classFilter, statusFilter);
              }}
              className="h-9 pl-8 pr-8 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  updateFiltersInUrl('', classFilter, statusFilter);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={sortField}
              onValueChange={(val) => setSortField(val as SortField)}
            >
              <SelectTrigger className="h-9 w-[150px] text-xs">
                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueAmount">Due Amount</SelectItem>
                <SelectItem value="name">Student Name</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="latestPayment">Coverage Date</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="h-9 px-2 text-xs"
              title={`Sorting ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!filteredRows.length}
              className="h-9 gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2 text-xs">
            <span className="text-muted-foreground">Active filters:</span>
            {search.trim() && (
              <Badge variant="secondary" className="gap-1 py-0.5 text-[11px]">
                Search: {search}
                <X
                  className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                  onClick={() => {
                    setSearch('');
                    updateFiltersInUrl('', classFilter, statusFilter);
                  }}
                />
              </Badge>
            )}
            {classFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 py-0.5 text-[11px]">
                Class {classFilter}
                <X
                  className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                  onClick={() => {
                    setClassFilter('all');
                    updateFiltersInUrl(search, 'all', statusFilter);
                  }}
                />
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 py-0.5 text-[11px]">
                Status: {statusFilter === 'never_paid' ? 'Never Paid' : 'Overdue'}
                <X
                  className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                  onClick={() => {
                    setStatusFilter('all');
                    updateFiltersInUrl(search, classFilter, 'all');
                  }}
                />
              </Badge>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Reset all
            </button>
            <span className="ml-auto text-[11px] text-muted-foreground">
              Showing {filteredRows.length} of {pendingRows.length}
            </span>
          </div>
        )}
      </div>

      {/* Table / Cards List */}
      {!filteredRows.length ? (
        <EmptyState
          title="No matching pending dues"
          description="Try adjusting your search terms or clearing your status and class filters."
          action={
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 sm:hidden">
            {filteredRows.map((row) => {
              const avatarColor = getAvatarColor(row.student.name);
              const initials = getInitials(row.student.name);

              return (
                <div
                  key={row.student.id}
                  className="relative rounded-xl border border-border/70 bg-card/70 p-3.5 shadow-xs transition-colors hover:border-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${avatarColor}`}
                      >
                        {initials}
                      </div>
                      <div>
                        <Link
                          href={`/students/${row.student.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {row.student.name}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                            Class {row.student.class}
                          </span>
                          {row.student.phone ? (
                            <a
                              href={`tel:${sanitizePhone(row.student.phone)}`}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              <Phone className="h-3 w-3" />
                              {row.student.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60">No phone</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {row.dueStatus === 'never_paid' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Never Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-xs">
                    <div>
                      <span className="text-muted-foreground">Last covered till:</span>
                      <p className="mt-0.5 font-medium text-foreground">
                        {row.latestPayment ? formatDate(row.latestPayment.period_end) : 'No payment record'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due amount:</span>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(row.dueAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <RecordPaymentDialog
                      students={[row.student]}
                      defaultStudentId={row.student.id}
                      trigger={
                        <Button size="sm" className="h-9 flex-1 gap-1.5 text-xs font-medium">
                          <Plus className="h-3.5 w-3.5" />
                          Record Fee
                        </Button>
                      }
                    />
                    <Button asChild size="sm" variant="outline" className="h-9 px-3 text-xs">
                      <Link href={`/students/${row.student.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card/50 sm:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[300px]">
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1.5 font-medium hover:text-foreground"
                    >
                      Student
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <button
                      type="button"
                      onClick={() => toggleSort('class')}
                      className="flex items-center gap-1.5 font-medium hover:text-foreground"
                    >
                      Class
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[180px]">
                    <button
                      type="button"
                      onClick={() => toggleSort('latestPayment')}
                      className="flex items-center gap-1.5 font-medium hover:text-foreground"
                    >
                      Last Covered Till
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <button
                      type="button"
                      onClick={() => toggleSort('dueAmount')}
                      className="flex items-center gap-1.5 font-medium hover:text-foreground"
                    >
                      Due Amount
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[180px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const avatarColor = getAvatarColor(row.student.name);
                  const initials = getInitials(row.student.name);

                  return (
                    <TableRow key={row.student.id} className="group border-border/40 hover:bg-muted/30">
                      {/* Student Info */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <Link
                              href={`/students/${row.student.id}`}
                              className="font-medium text-foreground transition-colors hover:text-primary hover:underline"
                            >
                              {row.student.name}
                            </Link>
                            {row.student.phone ? (
                              <div className="mt-0.5">
                                <a
                                  href={`tel:${sanitizePhone(row.student.phone)}`}
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <Phone className="h-3 w-3" />
                                  {row.student.phone}
                                </a>
                              </div>
                            ) : (
                              <p className="mt-0.5 text-xs text-muted-foreground/60">—</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Class */}
                      <TableCell className="py-3">
                        <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">
                          Class {row.student.class}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        {row.dueStatus === 'never_paid' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Never Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Overdue
                          </span>
                        )}
                      </TableCell>

                      {/* Last Covered Till */}
                      <TableCell className="py-3">
                        {row.latestPayment ? (
                          <div>
                            <span className="text-xs font-medium text-foreground">
                              {formatDate(row.latestPayment.period_end)}
                            </span>
                            <p className="text-[11px] text-muted-foreground">
                              Paid on {formatDate(row.latestPayment.payment_date)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/80">No payments yet</span>
                        )}
                      </TableCell>

                      {/* Due Amount */}
                      <TableCell className="py-3">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(row.dueAmount)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <RecordPaymentDialog
                            students={[row.student]}
                            defaultStudentId={row.student.id}
                            trigger={
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 px-3 text-xs font-medium"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Record Fee
                              </Button>
                            }
                          />

                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Link href={`/students/${row.student.id}`}>View</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
        <span>
          Showing {filteredRows.length} of {pendingRows.length} pending student{pendingRows.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          {isFetching && (
            <span role="status" aria-live="polite" className="text-muted-foreground">
              Syncing…
            </span>
          )}
          <span>Updated {formatDateTime(dataUpdatedAt || Date.now())}</span>
        </div>
      </div>
    </div>
  );
}
