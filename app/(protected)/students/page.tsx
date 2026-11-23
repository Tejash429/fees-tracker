import { StudentsTable } from '@/components/students/students-table';
import { StudentFormSheet } from '@/components/students/student-form-sheet';
import { StudentImportDialog } from '@/components/students/student-import-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { getStudentCounts, getStudentsTableData } from '@/lib/queries';
import { SortDirection, StudentClass, StudentsSortBy } from '@/types';

interface StudentsPageProps {
  searchParams?: {
    q?: string;
    class?: string;
    page?: string;
    sortBy?: string;
    sortDir?: string;
  };
}

const studentSortFields: StudentsSortBy[] = ['name', 'class', 'enrollment_date', 'created_at'];

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const search = searchParams?.q || '';

  const classFilter: 'all' | StudentClass =
    searchParams?.class === '9' || searchParams?.class === '10' ? searchParams.class : 'all';

  const page = Number(searchParams?.page || 1);

  const requestedSortBy = searchParams?.sortBy as StudentsSortBy | undefined;
  const sortBy: StudentsSortBy =
    requestedSortBy && studentSortFields.includes(requestedSortBy) ? requestedSortBy : 'created_at';

  const sortDir: SortDirection = searchParams?.sortDir === 'asc' ? 'asc' : 'desc';

  const [studentsData, counts] = await Promise.all([
    getStudentsTableData({
      search,
      classFilter,
      page,
      pageSize: 10,
      sortBy,
      sortDir
    }),
    getStudentCounts()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage enrolled students, search quickly, and import from Google Sheet/CSV/XLSX."
        actions={
          <>
            <StudentImportDialog />
            <StudentFormSheet mode="create" />
          </>
        }
      />

      <StudentsTable initialData={studentsData} initialCounts={counts} />
    </div>
  );
}
