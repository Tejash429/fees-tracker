'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowUpDown,
  Download,
  Eye,
  Printer,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { deletePaymentsBulkAction } from '@/lib/actions';
import { exportToExcel } from '@/lib/export';
import { printPaymentReceipt } from '@/components/payments/payment-receipt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { OverflowMenu } from '@/components/shared/overflow-menu';
import { DeletePaymentButton } from '@/components/payments/delete-payment-button';
import { PaymentDetailsSheet } from '@/components/payments/payment-details-sheet';
import { RecordPaymentDialog } from '@/components/payments/record-payment-dialog';
import { fetchPaymentsTableClient, fetchStudentsClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatCurrency, formatDate, formatDateTime, toISODate } from '@/lib/utils';
import { PaymentType, PaymentsSortBy, PaymentsTableData, Student, StudentClass } from '@/types';

const checkboxClassName =
  'h-4 w-4 rounded border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const PAYMENTS_PAGE_SIZE = 10;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function PaymentsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* 1. Filter Switcher Pills Skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>

      {/* 2. Toolbar Skeleton */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-3 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:max-w-xs rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 3. Table Container Skeleton */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
        <div className="border-b border-border/60 bg-muted/40 px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-md hidden sm:block" />
              <Skeleton className="h-5 w-20 rounded-md hidden sm:block" />
              <Skeleton className="h-4 w-28 rounded hidden md:block" />
              <Skeleton className="h-4 w-16 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-12 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom Pagination Skeleton */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function PaymentsTable({
  initialData,
  initialStudents
}: {
  initialData: PaymentsTableData;
  initialStudents: Student[];
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isBulkDeleting, startBulkDelete] = useTransition();

  const initialSearch = searchParams.get('q') || '';
  const initialClassFilter =
    searchParams.get('class') === '9' || searchParams.get('class') === '10'
      ? (searchParams.get('class') as StudentClass)
      : 'all';
  const initialTypeFilter =
    searchParams.get('type') === 'yearly' || searchParams.get('type') === 'half_yearly'
      ? (searchParams.get('type') as PaymentType)
      : 'all';
  const initialPage = Math.max(1, Number(searchParams.get('page') || initialData.page || 1));
  const initialSortBy =
    searchParams.get('sortBy') === 'payment_date' ||
    searchParams.get('sortBy') === 'amount' ||
    searchParams.get('sortBy') === 'period_end' ||
    searchParams.get('sortBy') === 'created_at'
      ? (searchParams.get('sortBy') as PaymentsSortBy)
      : initialData.sortBy;
  const initialSortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : initialData.sortDir;

  const [search, setSearch] = useState(initialSearch);
  const [classFilter, setClassFilter] = useState<'all' | StudentClass>(initialClassFilter);
  const [typeFilter, setTypeFilter] = useState<'all' | PaymentType>(initialTypeFilter);
  const [page, setPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<PaymentsSortBy>(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const updateFiltersInUrl = (
    nextSearch: string,
    nextClassFilter: 'all' | StudentClass,
    nextTypeFilter: 'all' | PaymentType,
    nextPage: number,
    nextSortBy: PaymentsSortBy,
    nextSortDir: 'asc' | 'desc'
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

    if (nextTypeFilter !== 'all') {
      params.set('type', nextTypeFilter);
    } else {
      params.delete('type');
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    } else {
      params.delete('page');
    }

    if (nextSortBy !== 'payment_date') {
      params.set('sortBy', nextSortBy);
    } else {
      params.delete('sortBy');
    }

    if (nextSortDir !== 'desc') {
      params.set('sortDir', nextSortDir);
    } else {
      params.delete('sortDir');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const selectAllRef = useRef<HTMLInputElement>(null);

  const isInitialParams =
    page === initialPage &&
    classFilter === initialClassFilter &&
    typeFilter === initialTypeFilter &&
    search === initialSearch &&
    sortBy === initialSortBy &&
    sortDir === initialSortDir;

  const { data, isPending: isPendingPayments, isFetching: isFetchingPayments, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.paymentsTable({
      search,
      classFilter,
      typeFilter,
      page,
      pageSize: PAYMENTS_PAGE_SIZE,
      sortBy,
      sortDir
    }),
    queryFn: () =>
      fetchPaymentsTableClient({
        search,
        classFilter,
        typeFilter,
        page,
        pageSize: PAYMENTS_PAGE_SIZE,
        sortBy,
        sortDir
      }),
    initialData: isInitialParams ? initialData : undefined,
    placeholderData: (previousData) => previousData
  });

  const { data: students = initialStudents, isPending: isPendingStudents, isFetching: isFetchingStudents } = useQuery(
    {
      queryKey: queryKeys.students,
      queryFn: fetchStudentsClient,
      initialData: initialStudents
    }
  );

  const payments = data?.rows ?? initialData.rows;
  const total = data?.total ?? initialData.total;
  const totalPages = Math.max(1, data?.totalPages ?? initialData.totalPages);
  const isPending = isPendingPayments || isPendingStudents;
  const isFetching = isFetchingPayments || isFetchingStudents;

  const selectedIdSet = useMemo(() => new Set(selectedPaymentIds), [selectedPaymentIds]);
  const visiblePaymentIds = useMemo(() => payments.map((payment) => payment.id), [payments]);

  const allVisibleSelected = useMemo(() => {
    if (!visiblePaymentIds.length) return false;
    return visiblePaymentIds.every((id) => selectedIdSet.has(id));
  }, [visiblePaymentIds, selectedIdSet]);

  const someVisibleSelected = useMemo(() => {
    if (!visiblePaymentIds.length) return false;
    return visiblePaymentIds.some((id) => selectedIdSet.has(id)) && !allVisibleSelected;
  }, [visiblePaymentIds, selectedIdSet, allVisibleSelected]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  useEffect(() => {
    const nextSearch = searchParams.get('q') || '';
    const nextClass =
      searchParams.get('class') === '9' || searchParams.get('class') === '10'
        ? (searchParams.get('class') as StudentClass)
        : 'all';
    const nextType =
      searchParams.get('type') === 'yearly' || searchParams.get('type') === 'half_yearly'
        ? (searchParams.get('type') as PaymentType)
        : 'all';
    const nextPage = Math.max(1, Number(searchParams.get('page') || 1));
    const nextSortBy =
      searchParams.get('sortBy') === 'payment_date' ||
      searchParams.get('sortBy') === 'amount' ||
      searchParams.get('sortBy') === 'period_end' ||
      searchParams.get('sortBy') === 'created_at'
        ? (searchParams.get('sortBy') as PaymentsSortBy)
        : 'payment_date';
    const nextSortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    setSearch(nextSearch);
    setClassFilter(nextClass);
    setTypeFilter(nextType);
    setPage(nextPage);
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
  }, [searchParams]);

  const toggleRowSelection = (paymentId: string) => {
    setSelectedPaymentIds((prev) => {
      if (prev.includes(paymentId)) {
        return prev.filter((id) => id !== paymentId);
      }
      return [...prev, paymentId];
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedPaymentIds((prev) => {
      const nextSet = new Set(prev);
      if (checked) {
        visiblePaymentIds.forEach((id) => nextSet.add(id));
      } else {
        visiblePaymentIds.forEach((id) => nextSet.delete(id));
      }
      return Array.from(nextSet);
    });
  };

  const clearSelection = () => setSelectedPaymentIds([]);

  const bulkDelete = () => {
    if (!selectedPaymentIds.length) {
      toast.error('Select at least one payment to delete');
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    startBulkDelete(async () => {
      const result = await deletePaymentsBulkAction(selectedPaymentIds);

      if (!result.success) {
        toast.error(result.error || 'Failed to delete selected payments');
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentsTableRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pending }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
      ]);

      setBulkDeleteDialogOpen(false);
      clearSelection();
      toast.success(result.message || 'Selected payments deleted');
    });
  };

  const hasActiveFilters = Boolean(search.trim()) || classFilter !== 'all' || typeFilter !== 'all';
  const pageRangeLabel = useMemo(() => {
    if (!total) return '0 of 0';
    const from = (page - 1) * PAYMENTS_PAGE_SIZE + 1;
    const to = Math.min(page * PAYMENTS_PAGE_SIZE, total);
    return `${from}–${to} of ${total}`;
  }, [page, total]);

  if (isPending && !payments.length) {
    return <PaymentsTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* 1. Quick Filter Pills Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setTypeFilter('all');
            setClassFilter('all');
            setPage(1);
            updateFiltersInUrl(search, 'all', 'all', 1, sortBy, sortDir);
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
            typeFilter === 'all' && classFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'border border-border/80 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          All Payments
        </button>

        <button
          type="button"
          onClick={() => {
            setTypeFilter('yearly');
            setPage(1);
            updateFiltersInUrl(search, classFilter, 'yearly', 1, sortBy, sortDir);
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
            typeFilter === 'yearly'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'border border-border/80 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          Yearly
        </button>

        <button
          type="button"
          onClick={() => {
            setTypeFilter('half_yearly');
            setPage(1);
            updateFiltersInUrl(search, classFilter, 'half_yearly', 1, sortBy, sortDir);
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
            typeFilter === 'half_yearly'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'border border-border/80 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          Half Yearly
        </button>

        <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={() => {
            const nextClass = classFilter === '9' ? 'all' : '9';
            setClassFilter(nextClass);
            setPage(1);
            updateFiltersInUrl(search, nextClass, typeFilter, 1, sortBy, sortDir);
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all cursor-pointer',
            classFilter === '9'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'border border-border/80 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          Class 9
        </button>

        <button
          type="button"
          onClick={() => {
            const nextClass = classFilter === '10' ? 'all' : '10';
            setClassFilter(nextClass);
            setPage(1);
            updateFiltersInUrl(search, nextClass, typeFilter, 1, sortBy, sortDir);
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all cursor-pointer',
            classFilter === '10'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'border border-border/80 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          Class 10
        </button>
      </div>

      {/* 2. Elevated Filter & Search Toolbar */}
      <div className="rounded-xl border border-border/80 bg-card/50 p-3 sm:p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input with Search & Clear icon */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by student name or phone..."
              value={search}
              onChange={(event) => {
                const nextSearch = event.target.value;
                setSearch(nextSearch);
                setPage(1);
                updateFiltersInUrl(nextSearch, classFilter, typeFilter, 1, sortBy, sortDir);
              }}
              className="pl-9 pr-8 h-10 w-full bg-background/60"
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  updateFiltersInUrl('', classFilter, typeFilter, 1, sortBy, sortDir);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Right Action Tools: Sort Dropdown, Sort Direction, Export, Bulk Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[155px]">
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  const nextSortBy = value as PaymentsSortBy;
                  setSortBy(nextSortBy);
                  setPage(1);
                  updateFiltersInUrl(search, classFilter, typeFilter, 1, nextSortBy, sortDir);
                }}
              >
                <SelectTrigger aria-label="Sort payments by" className="h-10 bg-background/60">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_date">Payment Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="period_end">Period End</SelectItem>
                  <SelectItem value="created_at">Created At</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-background/60"
              title={sortDir === 'asc' ? 'Ascending (Click for Descending)' : 'Descending (Click for Ascending)'}
              onClick={() => {
                const nextDir = sortDir === 'asc' ? 'desc' : 'asc';
                setSortDir(nextDir);
                setPage(1);
                updateFiltersInUrl(search, classFilter, typeFilter, 1, sortBy, nextDir);
              }}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-10 gap-2 bg-background/60"
              disabled={!payments.length}
              onClick={() => {
                const exportRows = payments.map((p) => ({
                  'Receipt No': `REC-${p.id.slice(0, 8).toUpperCase()}`,
                  'Student Name': p.students?.name || '—',
                  'Class': `Class ${p.students?.class || '—'}`,
                  'Phone': p.students?.phone || '—',
                  'Payment Type': p.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly',
                  'Amount (INR)': Number(p.amount || 0),
                  'Payment Date': p.payment_date,
                  'Period Start': p.period_start,
                  'Period End': p.period_end,
                  'Notes': p.notes || ''
                }));
                exportToExcel(exportRows, `Payments_${toISODate()}`);
              }}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>

            {selectedPaymentIds.length ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2 py-1">
                <Badge variant="outline" className="text-xs">
                  {selectedPaymentIds.length} selected
                </Badge>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearSelection}>
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={bulkDelete}
                  disabled={isBulkDeleting}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Toolbar Sub-bar */}
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span>Showing {pageRangeLabel} payments</span>
            {isFetching ? (
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Updating...
              </span>
            ) : null}
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setClassFilter('all');
                setTypeFilter('all');
                setPage(1);
                updateFiltersInUrl('', 'all', 'all', 1, sortBy, sortDir);
              }}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Reset filters
            </button>
          ) : (
            <span className="text-muted-foreground/70">
              Last updated: {formatDateTime(dataUpdatedAt || Date.now())}
            </span>
          )}
        </div>
      </div>

      {/* 3. Empty State vs Table Display */}
      {!payments.length ? (
        hasActiveFilters ? (
          <EmptyState
            title="No payments match filters"
            description="Try clearing search or changing class/payment type filter."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setClassFilter('all');
                  setTypeFilter('all');
                  setPage(1);
                  updateFiltersInUrl('', 'all', 'all', 1, sortBy, sortDir);
                }}
              >
                Clear all filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No payments yet"
            description="Start by recording your first fee payment."
            action={<RecordPaymentDialog students={students} />}
          />
        )
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {payments.map((payment) => {
              const studentName = payment.students?.name || 'Unknown student';
              const initials = getInitials(studentName);
              const avatarStyle = getAvatarColor(studentName);
              const receiptNo = `REC-${payment.id.slice(0, 8).toUpperCase()}`;

              return (
                <div
                  key={payment.id}
                  className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        className={checkboxClassName}
                        checked={selectedIdSet.has(payment.id)}
                        onChange={() => toggleRowSelection(payment.id)}
                        aria-label={`Select payment for ${studentName}`}
                      />
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold border select-none',
                          avatarStyle
                        )}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        {payment.students?.id ? (
                          <Link
                            href={`/students/${payment.students.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors truncate block"
                          >
                            {studentName}
                          </Link>
                        ) : (
                          <p className="font-semibold text-foreground truncate">{studentName}</p>
                        )}
                        <span className="text-xs font-mono text-muted-foreground">{receiptNo}</span>
                      </div>
                    </div>

                    <p className="font-bold text-base text-foreground tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium text-xs px-2 py-0.5',
                        payment.students?.class === '9'
                          ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                          : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                      )}
                    >
                      Class {payment.students?.class ?? '-'}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium text-xs px-2 py-0.5',
                        payment.payment_type === 'yearly'
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                      )}
                    >
                      {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                    </Badge>

                    <span className="text-muted-foreground ml-auto">{formatDate(payment.payment_date)}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatDate(payment.period_start)} – {formatDate(payment.period_end)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs gap-1"
                        onClick={() => printPaymentReceipt(payment)}
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Slip</span>
                      </Button>
                      <PaymentDetailsSheet payment={payment} />
                      <OverflowMenu label={`Actions for ${studentName} payment`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs gap-1.5"
                          onClick={() => printPaymentReceipt(payment)}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print receipt slip
                        </Button>
                        <RecordPaymentDialog
                          mode="edit"
                          payment={payment}
                          students={students}
                          payments={payments}
                          trigger={
                            <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                              Edit payment
                            </Button>
                          }
                        />
                        <DeletePaymentButton
                          paymentId={payment.id}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs text-destructive hover:text-destructive"
                            >
                              Delete payment
                            </Button>
                          }
                        />
                      </OverflowMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Data Table View */}
          <div className="hidden md:block rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
            <Table>
              <TableCaption className="sr-only">Payments history</TableCaption>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border/70 hover:bg-transparent">
                  <TableHead className="w-[42px] pl-4">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className={checkboxClassName}
                      checked={allVisibleSelected}
                      aria-checked={someVisibleSelected ? 'mixed' : allVisibleSelected}
                      onChange={(event) => toggleSelectAllVisible(event.target.checked)}
                      aria-label="Select all visible payments"
                    />
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Student / Receipt
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Class
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cycle
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Paid Date
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Coverage Period
                  </TableHead>
                  <TableHead className="py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="py-3.5 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const studentName = payment.students?.name || 'Unknown student';
                  const initials = getInitials(studentName);
                  const avatarStyle = getAvatarColor(studentName);
                  const receiptNo = `REC-${payment.id.slice(0, 8).toUpperCase()}`;

                  return (
                    <TableRow
                      key={payment.id}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                    >
                      {/* Checkbox */}
                      <TableCell className="pl-4 py-3">
                        <input
                          type="checkbox"
                          className={checkboxClassName}
                          checked={selectedIdSet.has(payment.id)}
                          onChange={() => toggleRowSelection(payment.id)}
                          aria-label={`Select payment for ${studentName}`}
                        />
                      </TableCell>

                      {/* Student Identity + Receipt Pill */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold border select-none',
                              avatarStyle
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            {payment.students?.id ? (
                              <Link
                                href={`/students/${payment.students.id}`}
                                className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
                              >
                                {studentName}
                              </Link>
                            ) : (
                              <span className="font-semibold text-foreground block truncate">
                                {studentName}
                              </span>
                            )}
                            <span className="text-xs font-mono text-muted-foreground/70">
                              {receiptNo}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Class Badge */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-medium px-2.5 py-0.5',
                            payment.students?.class === '9'
                              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                              : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                          )}
                        >
                          Class {payment.students?.class ?? '-'}
                        </Badge>
                      </TableCell>

                      {/* Payment Type */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-medium px-2.5 py-0.5',
                            payment.payment_type === 'yearly'
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                          )}
                        >
                          {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                        </Badge>
                      </TableCell>

                      {/* Payment Date */}
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {formatDate(payment.payment_date)}
                      </TableCell>

                      {/* Coverage Period */}
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {formatDate(payment.period_start)} – {formatDate(payment.period_end)}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-3 text-right font-bold text-base text-foreground tabular-nums">
                        {formatCurrency(payment.amount)}
                      </TableCell>

                      {/* Direct Actions */}
                      <TableCell className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => printPaymentReceipt(payment)}
                            title="Print receipt slip"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Slip</span>
                          </Button>

                          <PaymentDetailsSheet
                            payment={payment}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View</span>
                              </Button>
                            }
                          />

                          <OverflowMenu label={`Actions for ${studentName} payment`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs gap-1.5"
                              onClick={() => printPaymentReceipt(payment)}
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Print receipt
                            </Button>
                            <RecordPaymentDialog
                              mode="edit"
                              payment={payment}
                              students={students}
                              payments={payments}
                              trigger={
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                                  Edit payment
                                </Button>
                              }
                            />
                            <DeletePaymentButton
                              paymentId={payment.id}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-xs text-destructive hover:text-destructive"
                                >
                                  Delete payment
                                </Button>
                              }
                            />
                          </OverflowMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* 4. Bottom Pagination */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs"
                disabled={page <= 1 || isFetching}
                onClick={() => {
                  const nextPage = Math.max(1, page - 1);
                  setPage(nextPage);
                  updateFiltersInUrl(search, classFilter, typeFilter, nextPage, sortBy, sortDir);
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs"
                disabled={page >= totalPages || isFetching}
                onClick={() => {
                  const nextPage = Math.min(totalPages, page + 1);
                  setPage(nextPage);
                  updateFiltersInUrl(search, classFilter, typeFilter, nextPage, sortBy, sortDir);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected payments?</DialogTitle>
            <DialogDescription>
              This will permanently delete {selectedPaymentIds.length} selected payment record(s).
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
