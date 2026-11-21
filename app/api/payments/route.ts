import { NextResponse } from 'next/server';
import { getPayments, getPaymentsByStudent, getPaymentsTableData } from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { PaymentType, PaymentsSortBy, SortDirection, StudentClass } from '@/types';

export const dynamic = 'force-dynamic';

const paymentSortFields: PaymentsSortBy[] = ['payment_date', 'amount', 'period_end', 'created_at'];

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

      const typeParam = url.searchParams.get('type');
      const typeFilter: 'all' | PaymentType =
        typeParam === 'yearly' || typeParam === 'half_yearly' ? typeParam : 'all';

      const requestedSortBy = url.searchParams.get('sortBy') as PaymentsSortBy | null;
      const sortBy: PaymentsSortBy =
        requestedSortBy && paymentSortFields.includes(requestedSortBy) ? requestedSortBy : 'payment_date';

      const requestedSortDir = url.searchParams.get('sortDir');
      const sortDir: SortDirection = requestedSortDir === 'asc' ? 'asc' : 'desc';

      const search = url.searchParams.get('q') || '';
      const page = Number(url.searchParams.get('page') || 1);
      const pageSize = Number(url.searchParams.get('pageSize') || 10);

      const data = await getPaymentsTableData({
        search,
        classFilter,
        typeFilter,
        page,
        pageSize,
        sortBy,
        sortDir
      });

      return NextResponse.json(data);
    }

    const studentId = url.searchParams.get('studentId');
    if (studentId) {
      const data = await getPaymentsByStudent(studentId);
      return NextResponse.json(data);
    }

    const data = await getPayments();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load payments' },
      { status: 500 }
    );
  }
}
