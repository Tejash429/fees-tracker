'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { exportToExcel } from '@/lib/export';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';
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
import { RecordPaymentDialog } from '@/components/payments/record-payment-dialog';
import { fetchPendingStudentsClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { PendingStudent, StudentClass } from '@/types';

function PendingTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
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

  const filteredRows = useMemo(() => {
    const searchLower = search.trim().toLowerCase();

    return pendingRows.filter((row) => {
      const classMatches = classFilter === 'all' || row.student.class === classFilter;
      const statusMatches = statusFilter === 'all' || row.dueStatus === statusFilter;
      const searchMatches =
        !searchLower ||
        row.student.name.toLowerCase().includes(searchLower) ||
        Boolean(row.student.phone && row.student.phone.toLowerCase().includes(searchLower));

      return classMatches && statusMatches && searchMatches;
    });
  }, [pendingRows, classFilter, statusFilter, search]);

  if (isPending && !pendingRows.length) {
    return <PendingTableSkeleton />;
  }

  if (!pendingRows.length) {
    return (
      <EmptyState
        title="No pending dues"
        description="Great! All students are covered by active payment periods."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search pending student or phone"
          value={search}
          onChange={(event) => {
            const nextSearch = event.target.value;
            setSearch(nextSearch);
            updateFiltersInUrl(nextSearch, classFilter, statusFilter);
          }}
          className="w-full sm:w-[240px] h-11"
        />

        <div className="w-full sm:w-[170px]">
          <Select
            value={classFilter}
            onValueChange={(value) => {
              const nextClassFilter = value as 'all' | StudentClass;
              setClassFilter(nextClassFilter);
              updateFiltersInUrl(search, nextClassFilter, statusFilter);
            }}
          >
            <SelectTrigger aria-label="Filter pending students by class" className="h-11">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="9">Class 9</SelectItem>
              <SelectItem value="10">Class 10</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-[170px]">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              const nextStatusFilter = value as 'all' | 'never_paid' | 'overdue';
              setStatusFilter(nextStatusFilter);
              updateFiltersInUrl(search, classFilter, nextStatusFilter);
            }}
          >
            <SelectTrigger aria-label="Filter pending students by status" className="h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="never_paid">Never Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="h-11 gap-2"
          disabled={!filteredRows.length}
          onClick={() => {
            const exportRows = filteredRows.map((r) => ({
              'Student Name': r.student.name,
              'Class': `Class ${r.student.class}`,
              'Phone': r.student.phone || '—',
              'Due Status': r.dueStatus === 'never_paid' ? 'Never Paid' : 'Overdue',
              'Due Amount (INR)': r.dueAmount,
              'Last Payment Date': r.latestPayment?.payment_date || 'None',
              'Coverage End Date': r.latestPayment?.period_end || 'None'
            }));
            exportToExcel(exportRows, `Pending_Dues_${new Date().toISOString().split('T')[0]}`);
          }}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export
        </Button>

        <Badge variant="outline">Showing {filteredRows.length}</Badge>

        <p className="text-xs text-muted-foreground">Last updated: {formatDateTime(dataUpdatedAt || Date.now())}</p>

        {isFetching ? (
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            Updating pending dues…
          </p>
        ) : null}
      </div>

      {!filteredRows.length ? (
        <EmptyState title="No pending students match these filters" description="Try changing class or status filters." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredRows.map((row) => (
              <div key={row.student.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.student.name}</p>
                    <p className="text-xs text-muted-foreground">{row.student.phone || 'No phone'}</p>
                  </div>
                  <Badge variant="outline">Class {row.student.class}</Badge>
                </div>

                <div className="mt-3 grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    {row.dueStatus === 'never_paid' ? '⚠ Never Paid' : '⚠ Overdue'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Last covered till:</span>{' '}
                    {row.latestPayment ? formatDate(row.latestPayment.period_end) : 'No payment record'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Due amount:</span>{' '}
                    <span className="font-semibold">{formatCurrency(row.dueAmount)}</span>
                  </p>
                </div>

                <div className="mt-3">
                  <RecordPaymentDialog
                    students={[row.student]}
                    defaultStudentId={row.student.id}
                    trigger={<Button className="w-full">Record Payment</Button>}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableCaption className="sr-only">Pending dues table with quick record payment action.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Covered Till</TableHead>
                  <TableHead>Due Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.student.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.student.name}</p>
                        <p className="text-xs text-muted-foreground">{row.student.phone || 'No phone'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Class {row.student.class}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.dueStatus === 'never_paid' ? (
                        <Badge variant="destructive">⚠ Never Paid</Badge>
                      ) : (
                        <Badge variant="secondary">⚠ Overdue</Badge>
                      )}
                    </TableCell>
                    <TableCell>{row.latestPayment ? formatDate(row.latestPayment.period_end) : 'No payment record'}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(row.dueAmount)}</TableCell>
                    <TableCell className="text-right">
                      <RecordPaymentDialog
                        students={[row.student]}
                        defaultStudentId={row.student.id}
                        trigger={
                          <Button size="sm" className="ml-auto h-11">
                            Record Payment
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
