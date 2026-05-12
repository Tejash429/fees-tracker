import { PaymentType, PaymentsSortBy, SortDirection, StudentClass, StudentsSortBy } from '@/types';

interface StudentsTableKeyParams {
  search: string;
  classFilter: 'all' | StudentClass;
  page: number;
  pageSize: number;
  sortBy: StudentsSortBy;
  sortDir: SortDirection;
}

interface PaymentsTableKeyParams {
  classFilter: 'all' | StudentClass;
  typeFilter: 'all' | PaymentType;
  page: number;
  pageSize: number;
  sortBy: PaymentsSortBy;
  sortDir: SortDirection;
}

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  students: ['students'] as const,
  studentsTableRoot: ['students-table'] as const,
  studentsTable: (params: StudentsTableKeyParams) =>
    [
      'students-table',
      params.search,
      params.classFilter,
      params.page,
      params.pageSize,
      params.sortBy,
      params.sortDir
    ] as const,
  payments: ['payments'] as const,
  paymentsByStudent: (studentId: string) => ['payments', 'student', studentId] as const,
  paymentsTableRoot: ['payments-table'] as const,
  paymentsTable: (params: PaymentsTableKeyParams) =>
    [
      'payments-table',
      params.classFilter,
      params.typeFilter,
      params.page,
      params.pageSize,
      params.sortBy,
      params.sortDir
    ] as const,
  pending: ['pending'] as const,
  analytics: ['analytics'] as const,
  feeSettings: ['fee-settings'] as const
};
