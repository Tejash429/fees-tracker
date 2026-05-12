'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deletePaymentsBulkAction } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { PaymentType, PaymentsSortBy, PaymentsTableData, Student, StudentClass } from '@/types';

const checkboxClassName =
  'h-4 w-4 rounded border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const PAYMENTS_PAGE_SIZE = 10;

function PaymentsTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
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

  const [classFilter, setClassFilter] = useState<'all' | StudentClass>(initialClassFilter);
  const [typeFilter, setTypeFilter] = useState<'all' | PaymentType>(initialTypeFilter);
  const [page, setPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<PaymentsSortBy>(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const updateFiltersInUrl = (
    nextClassFilter: 'all' | StudentClass,
    nextTypeFilter: 'all' | PaymentType,
    nextPage: number,
    nextSortBy: PaymentsSortBy,
    nextSortDir: 'asc' | 'desc'
  ) => {
    const params = new URLSearchParams(searchParams.toString());

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

  const { data, isPending: isPendingPayments, isFetching: isFetchingPayments, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.paymentsTable({
      classFilter,
      typeFilter,
      page,
      pageSize: PAYMENTS_PAGE_SIZE,
      sortBy,
      sortDir
    }),
    queryFn: () =>
      fetchPaymentsTableClient({
        classFilter,
        typeFilter,
        page,
        pageSize: PAYMENTS_PAGE_SIZE,
        sortBy,
        sortDir
      }),
    initialData
  });

  const { data: students = initialStudents, isPending: isPendingStudents, isFetching: isFetchingStudents } = useQuery(
    {
      queryKey: queryKeys.students,
      queryFn: fetchStudentsClient,
      initialData: initialStudents
    }
  );

  const payments = useMemo(() => data?.rows ?? [], [data?.rows]);
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const isPending = isPendingPayments || isPendingStudents;
  const isFetching = isFetchingPayments || isFetchingStudents;

  const selectedIdSet = useMemo(() => new Set(selectedPaymentIds), [selectedPaymentIds]);
  const visiblePaymentIds = useMemo(() => payments.map((payment) => payment.id), [payments]);

  const selectedVisibleCount = useMemo(
    () => visiblePaymentIds.filter((id) => selectedIdSet.has(id)).length,
    [visiblePaymentIds, selectedIdSet]
  );

  const allVisibleSelected = visiblePaymentIds.length > 0 && selectedVisibleCount === visiblePaymentIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  useEffect(() => {
    const validIds = new Set(payments.map((payment) => payment.id));
    setSelectedPaymentIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [payments]);

  useEffect(() => {
    if (page <= totalPages) return;

    const nextPage = totalPages;
    setPage(nextPage);

    const params = new URLSearchParams(searchParams.toString());

    if (classFilter !== 'all') {
      params.set('class', classFilter);
    } else {
      params.delete('class');
    }

    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    } else {
      params.delete('type');
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    } else {
      params.delete('page');
    }

    if (sortBy !== 'payment_date') {
      params.set('sortBy', sortBy);
    } else {
      params.delete('sortBy');
    }

    if (sortDir !== 'desc') {
      params.set('sortDir', sortDir);
    } else {
      params.delete('sortDir');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [page, totalPages, searchParams, classFilter, typeFilter, sortBy, sortDir, router, pathname]);

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

  const hasActiveFilters = classFilter !== 'all' || typeFilter !== 'all';
  const pageRangeLabel = useMemo(() => {
    if (!total) return '0 of 0';
    const from = (page - 1) * PAYMENTS_PAGE_SIZE + 1;
    const to = Math.min(page * PAYMENTS_PAGE_SIZE, total);
    return `${from}-${to} of ${total}`;
  }, [page, total]);

  if (isPending && !payments.length) {
    return <PaymentsTableSkeleton />;
  }

  if (!payments.length && total === 0) {
    if (hasActiveFilters) {
      return <EmptyState title="No payments match filters" description="Try a different class/type filter." />;
    }

    return (
      <EmptyState
        title="No payments yet"
        description="Start by recording your first fee payment."
        action={<RecordPaymentDialog students={students} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/80 bg-card/40 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-[190px]">
            <label className="sr-only" htmlFor="payments-class-filter">
              Filter payments by class
            </label>
            <Select
              value={classFilter}
              onValueChange={(value) => {
                const nextClassFilter = value as 'all' | StudentClass;
                setClassFilter(nextClassFilter);
                setPage(1);
                updateFiltersInUrl(nextClassFilter, typeFilter, 1, sortBy, sortDir);
              }}
            >
              <SelectTrigger id="payments-class-filter" aria-label="Filter payments by class" className="h-11">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[190px]">
            <label className="sr-only" htmlFor="payments-type-filter">
              Filter payments by type
            </label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                const nextTypeFilter = value as 'all' | PaymentType;
                setTypeFilter(nextTypeFilter);
                setPage(1);
                updateFiltersInUrl(classFilter, nextTypeFilter, 1, sortBy, sortDir);
              }}
            >
              <SelectTrigger id="payments-type-filter" aria-label="Filter payments by payment type" className="h-11">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="half_yearly">Half Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[180px]">
            <Select
              value={sortBy}
              onValueChange={(value) => {
                const nextSortBy = value as PaymentsSortBy;
                setSortBy(nextSortBy);
                setPage(1);
                updateFiltersInUrl(classFilter, typeFilter, 1, nextSortBy, sortDir);
              }}
            >
              <SelectTrigger aria-label="Sort payments by" className="h-11">
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

          <div className="w-full sm:w-[160px]">
            <Select
              value={sortDir}
              onValueChange={(value) => {
                const nextSortDir = value as 'asc' | 'desc';
                setSortDir(nextSortDir);
                setPage(1);
                updateFiltersInUrl(classFilter, typeFilter, 1, sortBy, nextSortDir);
              }}
            >
              <SelectTrigger aria-label="Sort order" className="h-11">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline">Showing {pageRangeLabel}</Badge>
          <p className="text-xs text-muted-foreground">Last updated: {formatDateTime(dataUpdatedAt || Date.now())}</p>

          {isFetching ? (
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              Updating payments…
            </p>
          ) : null}

          {selectedPaymentIds.length ? (
            <div className="ml-auto flex flex-wrap items-center gap-2 rounded-md border border-border/80 bg-background/60 px-2 py-1">
              <Badge variant="outline">Selected: {selectedPaymentIds.length}</Badge>
              <Button variant="outline" size="sm" className="h-11" onClick={clearSelection} disabled={isBulkDeleting}>
                Clear
              </Button>
              <Button variant="destructive" size="sm" className="h-11" onClick={bulkDelete} disabled={isBulkDeleting}>
                {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {!payments.length ? (
        <EmptyState title="No payments match filters" description="Try a different class/type filter." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {payments.map((payment) => {
              const studentName = payment.students?.name || 'Unknown student';

              return (
                <div key={payment.id} className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className={checkboxClassName}
                        checked={selectedIdSet.has(payment.id)}
                        onChange={() => toggleRowSelection(payment.id)}
                        aria-label={`Select payment for ${studentName} on ${formatDate(payment.payment_date)}`}
                      />
                      <div>
                        <p className="font-medium">{studentName}</p>
                        <p className="text-xs text-muted-foreground">Class {payment.students?.class ?? '-'}</p>
                      </div>
                    </div>
                    <Badge variant={payment.payment_type === 'yearly' ? 'default' : 'secondary'}>
                      {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                    <p>Date: {formatDate(payment.payment_date)}</p>
                    <p>
                      Period: {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                    </p>
                    <p>
                      Amount: <span className="font-semibold text-foreground">{formatCurrency(payment.amount)}</span>
                    </p>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <OverflowMenu label={`Actions for ${studentName} payment`}>
                      <PaymentDetailsSheet
                        payment={payment}
                        trigger={
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            View details
                          </Button>
                        }
                      />
                      <RecordPaymentDialog
                        mode="edit"
                        payment={payment}
                        students={students}
                        payments={payments}
                        trigger={
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            Edit payment
                          </Button>
                        }
                      />
                      <DeletePaymentButton
                        paymentId={payment.id}
                        trigger={
                          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive">
                            Delete payment
                          </Button>
                        }
                      />
                    </OverflowMenu>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableCaption className="sr-only">Payments history with selection, filtering, and row-level actions.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[42px]">
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
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const studentName = payment.students?.name || 'Unknown student';

                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className={checkboxClassName}
                          checked={selectedIdSet.has(payment.id)}
                          onChange={() => toggleRowSelection(payment.id)}
                          aria-label={`Select payment for ${studentName} on ${formatDate(payment.payment_date)}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{studentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Class {payment.students?.class ?? '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.payment_type === 'yearly' ? 'default' : 'secondary'}>
                          {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>
                        {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground" title={payment.notes || ''}>
                        {payment.notes || '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-right">
                        <OverflowMenu label={`Actions for ${studentName} payment`}>
                          <PaymentDetailsSheet
                            payment={payment}
                            trigger={
                              <Button variant="ghost" size="sm" className="w-full justify-start">
                                View details
                              </Button>
                            }
                          />
                          <RecordPaymentDialog
                            mode="edit"
                            payment={payment}
                            students={students}
                            payments={payments}
                            trigger={
                              <Button variant="ghost" size="sm" className="w-full justify-start">
                                Edit payment
                              </Button>
                            }
                          />
                          <DeletePaymentButton
                            paymentId={payment.id}
                            trigger={
                              <Button variant="ghost" size="sm" className="w-full justify-start text-destructive">
                                Delete payment
                              </Button>
                            }
                          />
                        </OverflowMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => {
                  const nextPage = Math.max(1, page - 1);
                  setPage(nextPage);
                  updateFiltersInUrl(classFilter, typeFilter, nextPage, sortBy, sortDir);
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => {
                  const nextPage = Math.min(totalPages, page + 1);
                  setPage(nextPage);
                  updateFiltersInUrl(classFilter, typeFilter, nextPage, sortBy, sortDir);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!isBulkDeleting) setBulkDeleteDialogOpen(nextOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected payments?</DialogTitle>
            <DialogDescription>
              You are about to permanently delete {selectedPaymentIds.length} payment record(s). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={isBulkDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete} disabled={isBulkDeleting || !selectedPaymentIds.length}>
              {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
