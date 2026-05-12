import { NextResponse } from 'next/server';
import { getStudents, getStudentsTableData } from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { SortDirection, StudentClass, StudentsSortBy } from '@/types';

export const dynamic = 'force-dynamic';

const studentSortFields: StudentsSortBy[] = ['name', 'class', 'enrollment_date', 'created_at'];

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const view = url.searchParams.get('view');

    if (view === 'table') {
      const classParam = url.searchParams.get('class');
      const classFilter: 'all' | StudentClass = classParam === '9' || classParam === '10' ? classParam : 'all';

      const requestedSortBy = url.searchParams.get('sortBy') as StudentsSortBy | null;
      const sortBy: StudentsSortBy =
        requestedSortBy && studentSortFields.includes(requestedSortBy) ? requestedSortBy : 'created_at';

      const requestedSortDir = url.searchParams.get('sortDir');
      const sortDir: SortDirection = requestedSortDir === 'asc' ? 'asc' : 'desc';

      const page = Number(url.searchParams.get('page') || 1);
      const pageSize = Number(url.searchParams.get('pageSize') || 10);
      const search = url.searchParams.get('q') || '';

      const data = await getStudentsTableData({
        search,
        classFilter,
        page,
        pageSize,
        sortBy,
        sortDir
      });

      return NextResponse.json(data);
    }

    const data = await getStudents();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load students' },
      { status: 500 }
    );
  }
}
