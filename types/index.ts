export type StudentClass = '9' | '10';
export type PaymentType = 'yearly' | 'half_yearly';
export type SortDirection = 'asc' | 'desc';
export type StudentsSortBy = 'name' | 'class' | 'enrollment_date' | 'created_at';
export type PaymentsSortBy = 'payment_date' | 'amount' | 'period_end' | 'created_at';

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          name: string;
          class: StudentClass;
          phone: string | null;
          parent_name: string | null;
          enrollment_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          class: StudentClass;
          phone?: string | null;
          parent_name?: string | null;
          enrollment_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          class?: StudentClass;
          phone?: string | null;
          parent_name?: string | null;
          enrollment_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          payment_type: PaymentType;
          payment_date: string;
          period_start: string;
          period_end: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          amount: number;
          payment_type: PaymentType;
          payment_date: string;
          period_start: string;
          period_end: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          amount?: number;
          payment_type?: PaymentType;
          payment_date?: string;
          period_start?: string;
          period_end?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          }
        ];
      };
      fee_settings: {
        Row: {
          class: StudentClass;
          yearly_fee: number;
          updated_at: string;
        };
        Insert: {
          class: StudentClass;
          yearly_fee: number;
          updated_at?: string;
        };
        Update: {
          class?: StudentClass;
          yearly_fee?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Student = Database['public']['Tables']['students']['Row'];
export type NewStudent = Database['public']['Tables']['students']['Insert'];
export type UpdateStudent = Database['public']['Tables']['students']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type NewPayment = Database['public']['Tables']['payments']['Insert'];

export interface FeeSetting {
  class: StudentClass;
  yearlyFee: number;
  halfYearlyFee: number;
}

export interface PaymentWithStudent extends Payment {
  students: Pick<Student, 'id' | 'name' | 'class' | 'phone' | 'parent_name'> | null;
}

export interface DashboardStats {
  totalCollected: number;
  thisMonthCollection: number;
  previousMonthCollection: number;
  thisMonthDeltaPct: number;
  totalStudents: number;
  pendingDues: number;
  pendingStudentsCount: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  amount: number;
}

export interface DonutPoint {
  name: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  monthlyRevenue: MonthlyRevenuePoint[];
  classDonut: DonutPoint[];
  recentPayments: PaymentWithStudent[];
}

export interface AnalyticsData {
  monthlyRevenue: MonthlyRevenuePoint[];
  paymentTypeDonut: DonutPoint[];
  cumulativeCollection: MonthlyRevenuePoint[];
  classRevenue: Record<'9' | '10', number>;
}

export interface PendingStudent {
  student: Student;
  latestPayment: Payment | null;
  dueAmount: number;
  dueStatus: 'never_paid' | 'overdue';
}

export interface StudentsTableData {
  rows: Student[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: StudentsSortBy;
  sortDir: SortDirection;
}

export interface PaymentsTableData {
  rows: PaymentWithStudent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: PaymentsSortBy;
  sortDir: SortDirection;
}

export interface StudentFormInput {
  id?: string;
  name: string;
  class: StudentClass;
  parent_name?: string;
  phone?: string;
  enrollment_date: string;
}

export interface PaymentFormInput {
  student_id: string;
  payment_type: PaymentType;
  amount?: number;
  payment_date: string;
  period_start: string;
  period_end?: string;
  notes?: string;
}

export interface PaymentUpdateInput extends PaymentFormInput {
  id: string;
}

export interface ImportStudentRow {
  rowNumber: number;
  name: string;
  class: StudentClass | '';
  parent_name: string;
  phone: string;
  enrollment_date: string;
  errors: string[];
  status?: 'ready' | 'duplicate' | 'invalid';
}

export interface ImportReport {
  inserted: number;
  skippedDuplicates: number;
  failed: number;
  skippedRows: Array<{ rowNumber: number; reason: string }>;
  failedRows: Array<{ rowNumber: number; reason: string }>;
}

export interface ActionResult<T = void> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}
