import {
  AnalyticsData,
  DashboardData,
  FeeSetting,
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include'
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload as T;
}

export function fetchDashboardDataClient() {
  return fetchJson<DashboardData>('/api/dashboard');
}

export function fetchStudentsClient() {
  return fetchJson<Student[]>('/api/students');
}

interface StudentsTableQueryParams {
  search?: string;
  classFilter?: 'all' | StudentClass;
  page: number;
  pageSize: number;
  sortBy: StudentsSortBy;
  sortDir: SortDirection;
}

export function fetchStudentsTableClient(params: StudentsTableQueryParams) {
  const query = new URLSearchParams();
  query.set('view', 'table');
  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));
  query.set('sortBy', params.sortBy);
  query.set('sortDir', params.sortDir);

  if (params.search?.trim()) {
    query.set('q', params.search.trim());
  }

  if (params.classFilter && params.classFilter !== 'all') {
    query.set('class', params.classFilter);
  }

  return fetchJson<StudentsTableData>(`/api/students?${query.toString()}`);
}

export function fetchPaymentsClient() {
  return fetchJson<PaymentWithStudent[]>('/api/payments');
}

export function fetchPaymentsByStudentClient(studentId: string) {
  const query = new URLSearchParams();
  query.set('studentId', studentId);
  return fetchJson<PaymentWithStudent[]>(`/api/payments?${query.toString()}`);
}

interface PaymentsTableQueryParams {
  search?: string;
  classFilter?: 'all' | StudentClass;
  typeFilter?: 'all' | PaymentType;
  page: number;
  pageSize: number;
  sortBy: PaymentsSortBy;
  sortDir: SortDirection;
}

export function fetchPaymentsTableClient(params: PaymentsTableQueryParams) {
  const query = new URLSearchParams();
  query.set('view', 'table');
  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));
  query.set('sortBy', params.sortBy);
  query.set('sortDir', params.sortDir);

  if (params.search?.trim()) {
    query.set('q', params.search.trim());
  }

  if (params.classFilter && params.classFilter !== 'all') {
    query.set('class', params.classFilter);
  }

  if (params.typeFilter && params.typeFilter !== 'all') {
    query.set('type', params.typeFilter);
  }

  return fetchJson<PaymentsTableData>(`/api/payments?${query.toString()}`);
}

export function fetchPendingStudentsClient() {
  return fetchJson<PendingStudent[]>('/api/pending');
}

export function fetchAnalyticsDataClient() {
  return fetchJson<AnalyticsData>('/api/analytics');
}

export function fetchFeeSettingsClient() {
  return fetchJson<FeeSetting[]>('/api/fee-settings');
}
