'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Calendar, Download, Eye, Phone, Search, X } from 'lucide-react';
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
import { exportToExcel } from '@/lib/export';
import { fetchStudentsClient, fetchStudentsTableClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatDate, formatDateTime, toISODate } from '@/lib/utils';
import { Student, StudentClass, StudentsSortBy, StudentsTableData } from '@/types';

const STUDENTS_PAGE_SIZE = 10;

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

function StudentsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* 1. Class Switcher Pills Skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
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
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
      </div>

      {/* 3. Table Container Skeleton */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
        <div className="border-b border-border/60 bg-muted/40 px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
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
              <Skeleton className="h-4 w-24 rounded hidden md:block" />
              <Skeleton className="h-4 w-20 rounded hidden md:block" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-14 rounded-md" />
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

export function StudentsTable({
  initialData,
  allStudents = []
}: {
  initialData: StudentsTableData;
  allStudents?: Student[];
}) {
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

  const isInitialParams =
    page === initialPage &&
    classFilter === initialClassFilter &&
    search === initialSearch &&
    sortBy === initialSortBy &&
    sortDir === initialSortDir;

  const { data, isPending, isFetching, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.studentsTable({
      search,
      classFilter,
      page,
      pageSize: STUDENTS_PAGE_SIZE,
      sortBy,
      sortDir
    }),
    queryFn: () =>
      fetchStudentsTableClient({
        search,
        classFilter,
        page,
        pageSize: STUDENTS_PAGE_SIZE,
        sortBy,
        sortDir
      }),
    initialData: isInitialParams ? initialData : undefined,
    placeholderData: (previousData) => previousData
  });

  const { data: liveAllStudents = allStudents } = useQuery({
    queryKey: queryKeys.students,
    queryFn: fetchStudentsClient,
    initialData: allStudents
  });

  const students = data?.rows ?? initialData.rows;
  const total = data?.total ?? initialData.total;
  const totalPages = Math.max(1, data?.totalPages ?? initialData.totalPages);

  const counts = useMemo(() => {
    const totalCount = liveAllStudents.length;
    const class9Count = liveAllStudents.filter((s) => s.class === '9').length;
    const class10Count = liveAllStudents.filter((s) => s.class === '10').length;
    return { total: totalCount, class9: class9Count, class10: class10Count };
  }, [liveAllStudents]);

  useEffect(() => {
    const nextSearch = searchParams.get('q') || '';
    const nextClass =
      searchParams.get('class') === '9' || searchParams.get('class') === '10'
        ? (searchParams.get('class') as StudentClass)
        : 'all';
    const nextPage = Math.max(1, Number(searchParams.get('page') || 1));
    const nextSortBy =
      searchParams.get('sortBy') === 'name' ||
      searchParams.get('sortBy') === 'class' ||
      searchParams.get('sortBy') === 'enrollment_date' ||
      searchParams.get('sortBy') === 'created_at'
        ? (searchParams.get('sortBy') as StudentsSortBy)
        : 'created_at';
    const nextSortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    setSearch(nextSearch);
    setClassFilter(nextClass);
    setPage(nextPage);
    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
  }, [searchParams]);

  const hasActiveFilters = Boolean(search.trim()) || classFilter !== 'all';
  const pageRangeLabel = useMemo(() => {
    if (!total) return '0 of 0';
    const from = (page - 1) * STUDENTS_PAGE_SIZE + 1;
    const to = Math.min(page * STUDENTS_PAGE_SIZE, total);
    return `${from}–${to} of ${total}`;
  }, [page, total]);

  if (isPending && !students.length) {
    return <StudentsTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* 1. Class Segmented Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setClassFilter('all');
            setPage(1);
            updateFiltersInUrl(search, 'all', 1, sortBy, sortDir);
          }}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
            classFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'border border-border/80 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <span>All Students</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              classFilter === 'all'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {counts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setClassFilter('9');
            setPage(1);
            updateFiltersInUrl(search, '9', 1, sortBy, sortDir);
          }}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
            classFilter === '9'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'border border-border/80 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <span>Class 9</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              classFilter === '9'
                ? 'bg-white/20 text-white'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {counts.class9}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setClassFilter('10');
            setPage(1);
            updateFiltersInUrl(search, '10', 1, sortBy, sortDir);
          }}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
            classFilter === '10'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'border border-border/80 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <span>Class 10</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              classFilter === '10'
                ? 'bg-white/20 text-white'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {counts.class10}
          </span>
        </button>
      </div>

      {/* 2. Search & Filter Bar Card */}
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
                updateFiltersInUrl(nextSearch, classFilter, 1, sortBy, sortDir);
              }}
              className="pl-9 pr-8 h-10 w-full bg-background/60"
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  updateFiltersInUrl('', classFilter, 1, sortBy, sortDir);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Right Action Tools: Sort Dropdown, Sort Direction, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[160px]">
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  const nextSortBy = value as StudentsSortBy;
                  setSortBy(nextSortBy);
                  setPage(1);
                  updateFiltersInUrl(search, classFilter, 1, nextSortBy, sortDir);
                }}
              >
                <SelectTrigger aria-label="Sort students by" className="h-10 bg-background/60">
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

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-background/60"
              title={sortDir === 'asc' ? 'Ascending (Click for Descending)' : 'Descending (Click for Ascending)'}
              onClick={() => {
                const nextDir = sortDir === 'asc' ? 'desc' : 'asc';
                setSortDir(nextDir);
                setPage(1);
                updateFiltersInUrl(search, classFilter, 1, sortBy, nextDir);
              }}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="h-10 gap-2 bg-background/60"
              disabled={!students.length}
              onClick={() => {
                const exportRows = students.map((s) => ({
                  'Student Name': s.name,
                  'Class': `Class ${s.class}`,
                  'Phone': s.phone || '—',
                  'Enrollment Date': s.enrollment_date,
                  'Created At': s.created_at
                }));
                exportToExcel(exportRows, `Students_${toISODate()}`);
              }}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Toolbar Sub-bar: showing counts, live updating state, and reset filter */}
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span>Showing {pageRangeLabel} students</span>
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
                setPage(1);
                updateFiltersInUrl('', 'all', 1, sortBy, sortDir);
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
      {!students.length ? (
        hasActiveFilters ? (
          <EmptyState
            title="No matching students"
            description="Try adjusting your search query or class filter."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setClassFilter('all');
                  setPage(1);
                  updateFiltersInUrl('', 'all', 1, sortBy, sortDir);
                }}
              >
                Clear all filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No students yet"
            description="Add your first student or import from a spreadsheet to start fee tracking."
            action={<StudentFormSheet mode="create" />}
          />
        )
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {students.map((student) => {
              const initials = getInitials(student.name);
              const avatarStyle = getAvatarColor(student.name);

              return (
                <div
                  key={student.id}
                  className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold border select-none',
                          avatarStyle
                        )}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/students/${student.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors truncate block"
                        >
                          {student.name}
                        </Link>
                        {student.phone ? (
                          <a
                            href={`tel:${student.phone}`}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-0.5"
                          >
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">No phone</span>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium text-xs px-2.5 py-0.5',
                        student.class === '9'
                          ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                          : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                      )}
                    >
                      Class {student.class}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 opacity-70" />
                      Enrolled {formatDate(student.enrollment_date)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs">
                        <Link href={`/students/${student.id}`}>View profile</Link>
                      </Button>
                      <OverflowMenu label={`Actions for ${student.name}`}>
                        <Button asChild size="sm" variant="ghost" className="w-full justify-start text-xs">
                          <Link href={`/students/${student.id}`}>View full profile</Link>
                        </Button>
                        <StudentFormSheet
                          mode="edit"
                          student={student}
                          trigger={
                            <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                              Edit details
                            </Button>
                          }
                        />
                        <DeleteStudentButton
                          studentId={student.id}
                          studentName={student.name}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs text-destructive hover:text-destructive"
                            >
                              Delete student
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
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border/70 hover:bg-transparent">
                  <TableHead className="py-3.5 pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Student
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Class
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Phone
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Enrolled On
                  </TableHead>
                  <TableHead className="py-3.5 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const initials = getInitials(student.name);
                  const avatarStyle = getAvatarColor(student.name);

                  return (
                    <TableRow
                      key={student.id}
                      className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                    >
                      {/* 1. Student Avatar & Clickable Name */}
                      <TableCell className="py-3 pl-4">
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
                            <Link
                              href={`/students/${student.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
                            >
                              {student.name}
                            </Link>
                            <span className="text-xs text-muted-foreground/70">
                              ID: {student.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Color-accented Class Badge */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-medium px-2.5 py-0.5',
                            student.class === '9'
                              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                              : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                          )}
                        >
                          Class {student.class}
                        </Badge>
                      </TableCell>

                      {/* 3. Phone with Tel link */}
                      <TableCell className="py-3">
                        {student.phone ? (
                          <a
                            href={`tel:${student.phone}`}
                            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors group"
                          >
                            <Phone className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span>{student.phone}</span>
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground/60">—</span>
                        )}
                      </TableCell>

                      {/* 4. Enrollment Date with calendar indicator */}
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 opacity-60" />
                          {formatDate(student.enrollment_date)}
                        </span>
                      </TableCell>

                      {/* 5. Direct View Action + Portaled Overflow Menu */}
                      <TableCell className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                          >
                            <Link href={`/students/${student.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Link>
                          </Button>

                          <OverflowMenu label={`Actions for ${student.name}`}>
                            <Button asChild size="sm" variant="ghost" className="w-full justify-start text-xs">
                              <Link href={`/students/${student.id}`}>View full profile</Link>
                            </Button>
                            <StudentFormSheet
                              mode="edit"
                              student={student}
                              trigger={
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                                  Edit details
                                </Button>
                              }
                            />
                            <DeleteStudentButton
                              studentId={student.id}
                              studentName={student.name}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-xs text-destructive hover:text-destructive"
                                >
                                  Delete student
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
                  updateFiltersInUrl(search, classFilter, nextPage, sortBy, sortDir);
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
