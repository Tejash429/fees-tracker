import { PaymentType, StudentClass } from '@/types';

export const DEFAULT_YEARLY_FEE_MAP: Record<StudentClass, number> = {
  '9': 3000,
  '10': 4000
};

export function deriveHalfYearlyFee(yearlyFee: number) {
  return Math.round(yearlyFee / 2);
}

export function calculateAmount(
  studentClass: StudentClass,
  paymentType: PaymentType,
  yearlyFeeMap: Record<StudentClass, number> = DEFAULT_YEARLY_FEE_MAP
) {
  const yearlyFee = yearlyFeeMap[studentClass] ?? DEFAULT_YEARLY_FEE_MAP[studentClass];
  return paymentType === 'yearly' ? yearlyFee : deriveHalfYearlyFee(yearlyFee);
}

export function calculatePeriodEnd(periodStart: string, paymentType: PaymentType) {
  const start = new Date(periodStart);
  if (Number.isNaN(start.getTime())) return periodStart;

  const monthsToAdd = paymentType === 'yearly' ? 12 : 6;

  const end = new Date(start);
  end.setMonth(end.getMonth() + monthsToAdd);
  end.setDate(end.getDate() - 1);

  return end.toISOString().split('T')[0];
}

export function calculateDueAmount(
  studentClass: StudentClass,
  lastPaymentType?: PaymentType | null,
  yearlyFeeMap: Record<StudentClass, number> = DEFAULT_YEARLY_FEE_MAP
) {
  if (!lastPaymentType) return yearlyFeeMap[studentClass] ?? DEFAULT_YEARLY_FEE_MAP[studentClass];
  return calculateAmount(studentClass, lastPaymentType, yearlyFeeMap);
}
