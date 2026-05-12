'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { OverflowMenu } from '@/components/shared/overflow-menu';
import { DeleteStudentButton } from '@/components/students/delete-student-button';
import { StudentFormSheet } from '@/components/students/student-form-sheet';
import { fetchStudentsTableClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatDateTime } from '@/lib/utils';
import { StudentClass, StudentsSortBy, StudentsTableData } from '@/types';

const STUDENTS_PAGE_SIZE = 10;

function StudentsTableSkeleton() {
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

export function StudentsTable({ initialData }: { initialData: StudentsTableData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('q') || '';
  const initialClassFilter =
    searchParams.get('class') === '9' || searchParams.get('class') === '10'
      ? (searchParams.get('class') as StudentClass)
      : 'all';
  const initialPage = Math.max(1, Number(searchParams.get('page') || initialData.page || 1));
  const initialSortBy =
    searchParams.get('sortBy') === 'name' ||
    searchParams.get('sortBy') === 'class' ||
    searchParams.get('sortBy') === 'enrollment_date' ||
    searchParams.get('sortBy') === 'created_at'
      ? (searchParams.get('sortBy') as StudentsSortBy)
      : initialData.sortBy;
  const initialSortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : initialData.sortDir;

  const [search, setSearch] = useState(initialSearch);
  const [classFilter, setClassFilter] = useState<'all' | StudentClass>(initialClassFilter);
  const [page, setPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<StudentsSortBy>(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);

  const updateFiltersInUrl = (
    nextSearch: string,
    nextClassFilter: 'all' | StudentClass,
    nextPage: number,
    nextSortBy: StudentsSortBy,
    nextSortDir: 'asc' | 'desc'
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    const normalizedSearch = nextSearch.trim();
    if (normalizedSearch) {
      params.set('q', normalizedSearch);
    } else {
      params.delete('q');
    }

    if (nextClassFilter !== 'all') {
      params.set('class', nextClassFilter);
    } else {
      params.delete('class');
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    } else {
      params.delete('page');
    }

    if (nextSortBy !== 'created_at') {
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

  const normalizedSearch = search.trim();

  const { data, isPending, isFetching, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.studentsTable({
      search: normalizedSearch,
      classFilter,
      page,
      pageSize: STUDENTS_PAGE_SIZE,
      sortBy,
      sortDir
    }),
    queryFn: () =>
      fetchStudentsTableClient({
        search: normalizedSearch,
        classFilter,
        page,
        pageSize: STUDENTS_PAGE_SIZE,
        sortBy,
        sortDir
      }),
    initialData
  });

  const students = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const hasActiveFilters = Boolean(normalizedSearch) || classFilter !== 'all';

  useEffect(() => {
    if (page <= totalPages) return;

    const nextPage = totalPages;
    setPage(nextPage);

    const params = new URLSearchParams(searchParams.toString());

    if (normalizedSearch) {
      params.set('q', normalizedSearch);
    } else {
      params.delete('q');
    }

    if (classFilter !== 'all') {
      params.set('class', classFilter);
    } else {
      params.delete('class');
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    } else {
      params.delete('page');
    }

    if (sortBy !== 'created_at') {
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
  }, [page, totalPages, searchParams, normalizedSearch, classFilter, sortBy, sortDir, router, pathname]);

  const pageRangeLabel = useMemo(() => {
    if (!total) return '0 of 0';
    const from = (page - 1) * STUDENTS_PAGE_SIZE + 1;
    const to = Math.min(page * STUDENTS_PAGE_SIZE, total);
    return `${from}-${to} of ${total}`;
  }, [page, total]);

  if (isPending && !students.length) {
    return <StudentsTableSkeleton />;
  }

  if (!students.length && total === 0) {
    if (hasActiveFilters) {
      return <EmptyState title="No matching students" description="Try changing search or filter criteria." />;
    }

    return (
      <EmptyState
        title="No students yet"
        description="Add your first student or import from sheet to start fee tracking."
        action={<StudentFormSheet mode="create" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name / phone / parent"
          value={search}
          onChange={(event) => {
            const nextSearch = event.target.value;
            setSearch(nextSearch);
            setPage(1);
            updateFiltersInUrl(nextSearch, classFilter, 1, sortBy, sortDir);
          }}
          className="w-full md:max-w-sm"
        />

        <div className="w-full sm:w-[180px]">
          <Select
            value={classFilter}
            onValueChange={(value) => {
              const nextClassFilter = value as 'all' | StudentClass;
              setClassFilter(nextClassFilter);
              setPage(1);
              updateFiltersInUrl(search, nextClassFilter, 1, sortBy, sortDir);
            }}
          >
            <SelectTrigger>
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
          <Select
            value={sortBy}
            onValueChange={(value) => {
              const nextSortBy = value as StudentsSortBy;
              setSortBy(nextSortBy);
              setPage(1);
              updateFiltersInUrl(search, classFilter, 1, nextSortBy, sortDir);
            }}
          >
            <SelectTrigger aria-label="Sort students by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="class">Class</SelectItem>
              <SelectItem value="enrollment_date">Enrollment Date</SelectItem>
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
              updateFiltersInUrl(search, classFilter, 1, sortBy, nextSortDir);
            }}
          >
            <SelectTrigger aria-label="Sort order">
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
          <Badge variant="secondary" role="status" aria-live="polite">
            Updating...
          </Badge>
        ) : null}
      </div>

      {!students.length ? (
        <EmptyState title="No matching students" description="Try changing search or filter criteria." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {students.map((student) => (
              <div key={student.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.phone || 'No phone'}</p>
                  </div>
                  <Badge variant="secondary">Class {student.class}</Badge>
                </div>

                <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  <p>Parent: {student.parent_name || '—'}</p>
                  <p>Enrollment: {formatDate(student.enrollment_date)}</p>
                </div>

                <div className="mt-3 flex justify-end">
                  <OverflowMenu label={`Actions for ${student.name}`}>
                    <Button asChild size="sm" variant="ghost" className="w-full justify-start">
                      <Link href={`/students/${student.id}`}>View profile</Link>
                    </Button>
                    <StudentFormSheet
                      mode="edit"
                      student={student}
                      trigger={
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          Edit details
                        </Button>
                      }
                    />
                    <DeleteStudentButton
                      studentId={student.id}
                      studentName={student.name}
                      trigger={
                        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive">
                          Delete student
                        </Button>
                      }
                    />
                  </OverflowMenu>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Class {student.class}</Badge>
                    </TableCell>
                    <TableCell>{student.parent_name || '—'}</TableCell>
                    <TableCell>{student.phone || '—'}</TableCell>
                    <TableCell>{formatDate(student.enrollment_date)}</TableCell>
                    <TableCell className="text-right">
                      <OverflowMenu label={`Actions for ${student.name}`}>
                        <Button asChild size="sm" variant="ghost" className="w-full justify-start">
                          <Link href={`/students/${student.id}`}>View profile</Link>
                        </Button>
                        <StudentFormSheet
                          mode="edit"
                          student={student}
                          trigger={
                            <Button variant="ghost" size="sm" className="w-full justify-start">
                              Edit details
                            </Button>
                          }
                        />
                        <DeleteStudentButton
                          studentId={student.id}
                          studentName={student.name}
                          trigger={
                            <Button variant="ghost" size="sm" className="w-full justify-start text-destructive">
                              Delete student
                            </Button>
                          }
                        />
                      </OverflowMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
                  updateFiltersInUrl(search, classFilter, nextPage, sortBy, sortDir);
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
                  updateFiltersInUrl(search, classFilter, nextPage, sortBy, sortDir);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
