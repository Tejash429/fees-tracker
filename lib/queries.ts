import { getYearlyFeeMap } from '@/lib/fee-settings';
import { calculateDueAmount } from '@/lib/fees';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  DashboardStats,
  DonutPoint,
  MonthlyRevenuePoint,
  Payment,
  PaymentType,
  PaymentWithStudent,
  PaymentsSortBy,
  PaymentsTableData,
  PendingStudent,
  SortDirection,
  Student,
  StudentClass,
  StudentsSortBy,
  StudentsTableData
} from '@/types';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: '2-digit'
  }).format(date);
}

const STUDENTS_SORT_COLUMNS: StudentsSortBy[] = ['name', 'class', 'enrollment_date', 'created_at'];

interface GetStudentsTableOptions {
  search?: string;
  classFilter?: 'all' | StudentClass;
  page?: number;
  pageSize?: number;
  sortBy?: StudentsSortBy;
  sortDir?: SortDirection;
}

export async function getStudentsTableData(options: GetStudentsTableOptions = {}): Promise<StudentsTableData> {
  const supabase = createServerSupabaseClient();

  const search = String(options.search || '').trim();
  const classFilter = options.classFilter || 'all';
  const pageSize = Number.isFinite(options.pageSize) ? Math.max(1, Math.min(Number(options.pageSize), 100)) : 10;
  const page = Number.isFinite(options.page) ? Math.max(1, Number(options.page)) : 1;
  const requestedSortBy = options.sortBy;
  const sortBy: StudentsSortBy =
    requestedSortBy && STUDENTS_SORT_COLUMNS.includes(requestedSortBy) ? requestedSortBy : 'created_at';
  const sortDir: SortDirection = options.sortDir === 'asc' ? 'asc' : 'desc';

  let query = supabase.from('students').select('*', { count: 'exact' });

  if (classFilter === '9' || classFilter === '10') {
    query = query.eq('class', classFilter);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(from, to);

  if (error) {
    if (error.message.includes('Requested range not satisfiable') || (error as { code?: string }).code === 'PGRST103') {
      const fallbackQuery = supabase
        .from('students')
        .select('*', { count: 'exact' });
      if (classFilter === '9' || classFilter === '10') fallbackQuery.eq('class', classFilter);
      if (search) fallbackQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      const fallback = await fallbackQuery
        .order(sortBy, { ascending: sortDir === 'asc' })
        .range(0, pageSize - 1);

      const total = fallback.count || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return {
        rows: (fallback.data || []) as Student[],
        total,
        page: 1,
        pageSize,
        totalPages,
        sortBy,
        sortDir
      };
    }
    throw new Error(error.message);
  }

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    rows: (data || []) as Student[],
    total,
    page,
    pageSize,
    totalPages,
    sortBy,
    sortDir
  };
}

export async function getStudents() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Student[];
}

export async function getStudentById(studentId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data || null) as Student | null;
}

export async function getPayments() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*, students(id, name, class, phone, parent_name)')
    .order('payment_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as PaymentWithStudent[];
}

async function getPaymentsForPending() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payments')
    .select('id, student_id, amount, payment_type, payment_date, period_start, period_end, notes, created_at')
    .order('period_end', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Payment[];
}

export async function getPaymentsByStudent(studentId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*, students(id, name, class, phone, parent_name)')
    .eq('student_id', studentId)
    .order('payment_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as PaymentWithStudent[];
}

const PAYMENTS_SORT_COLUMNS: PaymentsSortBy[] = ['payment_date', 'amount', 'period_end', 'created_at'];

interface GetPaymentsTableOptions {
  search?: string;
  classFilter?: 'all' | StudentClass;
  typeFilter?: 'all' | PaymentType;
  page?: number;
  pageSize?: number;
  sortBy?: PaymentsSortBy;
  sortDir?: SortDirection;
}

export async function getPaymentsTableData(options: GetPaymentsTableOptions = {}): Promise<PaymentsTableData> {
  const supabase = createServerSupabaseClient();

  const search = options.search?.trim();
  const classFilter = options.classFilter || 'all';
  const typeFilter = options.typeFilter || 'all';
  const pageSize = Number.isFinite(options.pageSize) ? Math.max(1, Math.min(Number(options.pageSize), 100)) : 10;
  const page = Number.isFinite(options.page) ? Math.max(1, Number(options.page)) : 1;
  const requestedSortBy = options.sortBy;
  const sortBy: PaymentsSortBy =
    requestedSortBy && PAYMENTS_SORT_COLUMNS.includes(requestedSortBy) ? requestedSortBy : 'payment_date';
  const sortDir: SortDirection = options.sortDir === 'asc' ? 'asc' : 'desc';

  let query = supabase
    .from('payments')
    .select('*, students!inner(id, name, class, phone)', { count: 'exact' });

  if (classFilter === '9' || classFilter === '10') {
    query = query.eq('students.class', classFilter);
  }

  if (typeFilter === 'yearly' || typeFilter === 'half_yearly') {
    query = query.eq('payment_type', typeFilter);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'students' });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(from, to);

  if (error) {
    if (error.message.includes('Requested range not satisfiable') || (error as { code?: string }).code === 'PGRST103') {
      const fallbackQuery = supabase
        .from('payments')
        .select('*, students!inner(id, name, class, phone)', { count: 'exact' });
      if (classFilter === '9' || classFilter === '10') fallbackQuery.eq('students.class', classFilter);
      if (typeFilter === 'yearly' || typeFilter === 'half_yearly') fallbackQuery.eq('payment_type', typeFilter);
      if (search) fallbackQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'students' });
      const fallback = await fallbackQuery
        .order(sortBy, { ascending: sortDir === 'asc' })
        .range(0, pageSize - 1);

      const total = fallback.count || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return {
        rows: (fallback.data || []) as PaymentWithStudent[],
        total,
        page: 1,
        pageSize,
        totalPages,
        sortBy,
        sortDir
      };
    }
    throw new Error(error.message);
  }

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    rows: (data || []) as PaymentWithStudent[],
    total,
    page,
    pageSize,
    totalPages,
    sortBy,
    sortDir
  };
}

function buildMonthlyRevenue(payments: PaymentWithStudent[], months = 12): MonthlyRevenuePoint[] {
  const now = new Date();
  const monthKeys: string[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(monthKey(d));
  }

  const monthlyMap = new Map<string, number>(monthKeys.map((key) => [key, 0]));

  payments.forEach((payment) => {
    const paidOn = new Date(payment.payment_date);
    const key = monthKey(new Date(paidOn.getFullYear(), paidOn.getMonth(), 1));
    if (!monthlyMap.has(key)) return;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(payment.amount || 0));
  });

  return monthKeys.map((key) => ({
    month: monthLabelFromKey(key),
    amount: monthlyMap.get(key) || 0
  }));
}

function buildPending(
  students: Student[],
  payments: Payment[],
  yearlyFeeMap: Record<'9' | '10', number>
): PendingStudent[] {
  const latestPaymentByStudent = new Map<string, Payment>();

  payments.forEach((payment) => {
    const existing = latestPaymentByStudent.get(payment.student_id);
    if (!existing) {
      latestPaymentByStudent.set(payment.student_id, payment);
      return;
    }

    const currentEnd = new Date(existing.period_end).getTime();
    const incomingEnd = new Date(payment.period_end).getTime();
    if (incomingEnd > currentEnd) {
      latestPaymentByStudent.set(payment.student_id, payment);
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return students.reduce<PendingStudent[]>((acc, student) => {
    const latestPayment = latestPaymentByStudent.get(student.id) || null;

    if (!latestPayment) {
      acc.push({
        student,
        latestPayment: null,
        dueAmount: calculateDueAmount(student.class, null, yearlyFeeMap),
        dueStatus: 'never_paid'
      });
      return acc;
    }

    const endDate = new Date(latestPayment.period_end);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < today) {
      acc.push({
        student,
        latestPayment,
        dueAmount: calculateDueAmount(student.class, latestPayment.payment_type, yearlyFeeMap),
        dueStatus: 'overdue'
      });
    }

    return acc;
  }, []);
}

export async function getDashboardData() {
  const [students, payments, yearlyFeeMap] = await Promise.all([getStudents(), getPayments(), getYearlyFeeMap()]);

  const totalCollected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousMonthYear = previousMonthDate.getFullYear();

  let thisMonthCollection = 0;
  let previousMonthCollection = 0;

  payments.forEach((payment) => {
    const date = new Date(payment.payment_date);

    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      thisMonthCollection += Number(payment.amount || 0);
      return;
    }

    if (date.getMonth() === previousMonth && date.getFullYear() === previousMonthYear) {
      previousMonthCollection += Number(payment.amount || 0);
    }
  });

  const thisMonthDeltaPct =
    previousMonthCollection === 0
      ? thisMonthCollection > 0
        ? 100
        : 0
      : ((thisMonthCollection - previousMonthCollection) / previousMonthCollection) * 100;

  const pendingList = buildPending(students, payments, yearlyFeeMap);
  const pendingDues = pendingList.reduce((sum, item) => sum + item.dueAmount, 0);

  const stats: DashboardStats = {
    totalCollected,
    thisMonthCollection,
    previousMonthCollection,
    thisMonthDeltaPct,
    totalStudents: students.length,
    pendingDues,
    pendingStudentsCount: pendingList.length
  };

  const classRevenueMap: Record<'9' | '10', number> = {
    '9': 0,
    '10': 0
  };

  payments.forEach((payment) => {
    const cls = payment.students?.class;
    if (!cls) return;
    classRevenueMap[cls] += Number(payment.amount || 0);
  });

  const classDonut: DonutPoint[] = [
    { name: 'Class 9', value: classRevenueMap['9'] },
    { name: 'Class 10', value: classRevenueMap['10'] }
  ];

  return {
    stats,
    monthlyRevenue: buildMonthlyRevenue(payments, 8),
    classDonut,
    recentPayments: payments.slice(0, 8)
  };
}

export async function getPendingStudentsData() {
  const [students, payments, yearlyFeeMap] = await Promise.all([
    getStudents(),
    getPaymentsForPending(),
    getYearlyFeeMap()
  ]);

  return buildPending(students, payments, yearlyFeeMap);
}

export async function getAnalyticsData() {
  const payments = await getPayments();

  const monthlyRevenue = buildMonthlyRevenue(payments, 12);

  const paymentTypeTotals = payments.reduce(
    (acc, payment) => {
      acc[payment.payment_type] += Number(payment.amount || 0);
      return acc;
    },
    {
      yearly: 0,
      half_yearly: 0
    }
  );

  const paymentTypeDonut: DonutPoint[] = [
    { name: 'Yearly', value: paymentTypeTotals.yearly },
    { name: 'Half Yearly', value: paymentTypeTotals.half_yearly }
  ];

  let cumulative = 0;
  const cumulativeCollection = monthlyRevenue.map((item) => {
    cumulative += item.amount;
    return {
      month: item.month,
      amount: cumulative
    };
  });

  const classRevenue = payments.reduce(
    (acc, payment) => {
      const studentClass = payment.students?.class;
      if (!studentClass) return acc;
      acc[studentClass] += Number(payment.amount || 0);
      return acc;
    },
    {
      '9': 0,
      '10': 0
    }
  );

  return {
    monthlyRevenue,
    paymentTypeDonut,
    cumulativeCollection,
    classRevenue
  };
}
