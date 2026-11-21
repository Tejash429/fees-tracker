'use client';

import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPaymentAction, updatePaymentAction } from '@/lib/actions';
import { DEFAULT_YEARLY_FEE_MAP, calculateAmount, calculatePeriodEnd, deriveHalfYearlyFee } from '@/lib/fees';
import { fetchFeeSettingsClient, fetchPaymentsClient, fetchStudentsClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, toISODate } from '@/lib/utils';
import { Payment, PaymentType, Student } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface RecordPaymentDialogProps {
  mode?: 'create' | 'edit';
  payment?: Payment;
  students: Student[];
  payments?: Array<Pick<Payment, 'student_id' | 'payment_type'>>;
  trigger?: React.ReactNode;
  defaultStudentId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRecorded?: () => void;
}

interface PaymentFormErrors {
  studentId?: string;
  amount?: string;
  periodStart?: string;
  periodEnd?: string;
  paymentDate?: string;
  form?: string;
}

function getInitialState(mode: 'create' | 'edit', payment?: Payment, defaultStudentId?: string) {
  const startDate = toISODate();

  if (mode === 'edit' && payment) {
    return {
      studentId: payment.student_id,
      paymentType: payment.payment_type,
      periodStart: payment.period_start,
      periodEnd: payment.period_end,
      paymentDate: payment.payment_date,
      amount: Number(payment.amount || 0),
      notes: payment.notes || '',
      manualPeriodEnd: true
    };
  }

  return {
    studentId: defaultStudentId || '',
    paymentType: 'yearly' as PaymentType,
    periodStart: startDate,
    periodEnd: calculatePeriodEnd(startDate, 'yearly'),
    paymentDate: startDate,
    amount: 0,
    notes: '',
    manualPeriodEnd: false
  };
}

export function RecordPaymentDialog({
  mode = 'create',
  payment,
  students,
  payments = [],
  trigger,
  defaultStudentId,
  open: controlledOpen,
  onOpenChange,
  onRecorded
}: RecordPaymentDialogProps) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isControlled = typeof controlledOpen === 'boolean';
  const open = isControlled ? controlledOpen : internalOpen;

  const { data: liveStudents = students } = useQuery({
    queryKey: queryKeys.students,
    queryFn: fetchStudentsClient,
    initialData: students,
    enabled: open
  });

  const { data: livePayments = payments as Payment[] } = useQuery({
    queryKey: queryKeys.payments,
    queryFn: fetchPaymentsClient,
    initialData: payments as Payment[],
    enabled: open
  });

  const { data: feeSettings = [] } = useQuery({
    queryKey: queryKeys.feeSettings,
    queryFn: fetchFeeSettingsClient,
    enabled: open
  });

  const yearlyFeeMap = useMemo(
    () => ({
      '9': feeSettings.find((setting) => setting.class === '9')?.yearlyFee ?? DEFAULT_YEARLY_FEE_MAP['9'],
      '10': feeSettings.find((setting) => setting.class === '10')?.yearlyFee ?? DEFAULT_YEARLY_FEE_MAP['10']
    }),
    [feeSettings]
  );

  const initialState = getInitialState(mode, payment, defaultStudentId);

  const [studentId, setStudentId] = useState(initialState.studentId);
  const [paymentType, setPaymentType] = useState<PaymentType>(initialState.paymentType);
  const [periodStart, setPeriodStart] = useState(initialState.periodStart);
  const [periodEnd, setPeriodEnd] = useState(initialState.periodEnd);
  const [paymentDate, setPaymentDate] = useState(initialState.paymentDate);
  const [amount, setAmount] = useState<number>(initialState.amount);
  const [notes, setNotes] = useState(initialState.notes);
  const [manualPeriodEnd, setManualPeriodEnd] = useState(initialState.manualPeriodEnd);
  const [errors, setErrors] = useState<PaymentFormErrors>({});

  const selectedStudent = useMemo(
    () => liveStudents.find((student) => student.id === studentId),
    [liveStudents, studentId]
  );

  const hasHalfYearlyHistoryByStudent = useMemo(() => {
    const map = new Map<string, boolean>();

    livePayments.forEach((item) => {
      if (item.payment_type === 'half_yearly') {
        map.set(item.student_id, true);
      }
    });

    return map;
  }, [livePayments]);

  const canUseYearlyForSelectedStudent = !studentId || !hasHalfYearlyHistoryByStudent.get(studentId);

  useEffect(() => {
    if (!selectedStudent) return;
    setAmount(calculateAmount(selectedStudent.class, paymentType, yearlyFeeMap));
  }, [selectedStudent, paymentType, yearlyFeeMap]);

  useEffect(() => {
    if (!canUseYearlyForSelectedStudent && paymentType === 'yearly') {
      setPaymentType('half_yearly');
    }
  }, [canUseYearlyForSelectedStudent, paymentType]);

  useEffect(() => {
    if (!studentId) return;

    if (mode === 'edit' && payment) {
      setPeriodStart(payment.period_start);
      setPeriodEnd(payment.period_end);
      return;
    }

    const studentPayments = livePayments
      .filter((p) => p.student_id === studentId)
      .sort((a, b) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime());

    let computedStart = paymentDate || toISODate();
    if (studentPayments.length > 0 && studentPayments[0].period_end) {
      const prevEnd = new Date(studentPayments[0].period_end);
      if (!Number.isNaN(prevEnd.getTime())) {
        prevEnd.setDate(prevEnd.getDate() + 1);
        computedStart = prevEnd.toISOString().split('T')[0];
      }
    }

    setPeriodStart(computedStart);
    setPeriodEnd(calculatePeriodEnd(computedStart, paymentType));
  }, [studentId, paymentType, paymentDate, livePayments, mode, payment]);

  useEffect(() => {
    if (!open) {
      const reset = getInitialState(mode, payment, defaultStudentId);
      setStudentId(reset.studentId);
      setPaymentType(reset.paymentType);
      setPeriodStart(reset.periodStart);
      setPeriodEnd(reset.periodEnd);
      setPaymentDate(reset.paymentDate);
      setAmount(reset.amount);
      setNotes(reset.notes);
      setManualPeriodEnd(reset.manualPeriodEnd);
      setErrors({});
    }
  }, [defaultStudentId, mode, open, payment]);

  const setOpenState = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  const validateForm = () => {
    const nextErrors: PaymentFormErrors = {};

    if (!studentId) {
      nextErrors.studentId = 'Please select a student.';
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = 'Amount must be greater than 0.';
    }

    const periodStartDate = new Date(periodStart);
    if (!periodStart || Number.isNaN(periodStartDate.getTime())) {
      nextErrors.periodStart = 'Period start date is invalid.';
    }

    const periodEndDate = new Date(periodEnd);
    if (!periodEnd || Number.isNaN(periodEndDate.getTime())) {
      nextErrors.periodEnd = 'Period end date is invalid.';
    }

    const paymentDateValue = new Date(paymentDate);
    if (!paymentDate || Number.isNaN(paymentDateValue.getTime())) {
      nextErrors.paymentDate = 'Payment date is invalid.';
    }

    if (!nextErrors.periodStart && !nextErrors.periodEnd && periodEndDate < periodStartDate) {
      nextErrors.periodEnd = 'Period end must be on or after period start.';
    }

    if (paymentType === 'yearly' && !canUseYearlyForSelectedStudent) {
      nextErrors.form =
        'Yearly payment is not allowed because the selected student already has a half-yearly installment.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    startTransition(async () => {
      const payload = {
        student_id: studentId,
        payment_type: paymentType,
        amount,
        period_start: periodStart,
        period_end: periodEnd,
        payment_date: paymentDate,
        notes
      };

      const result =
        mode === 'edit' && payment?.id
          ? await updatePaymentAction({ id: payment.id, ...payload })
          : await createPaymentAction(payload);

      if (!result.success) {
        setErrors((prev) => ({ ...prev, form: result.error || 'Could not save payment' }));
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentsTableRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pending }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
      ]);

      toast.success(result.message || (mode === 'edit' ? 'Payment updated' : 'Payment recorded'));
      onRecorded?.();
      setOpenState(false);
    });
  };

  const selectedClassFee = selectedStudent ? yearlyFeeMap[selectedStudent.class] : null;

  return (
    <Dialog open={open} onOpenChange={setOpenState}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2">
            {mode === 'edit' ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            {mode === 'edit' ? 'Edit Payment' : 'Record Payment'}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
          <DialogDescription>
            Amount uses class fee settings by default. You can adjust values before saving.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-2 md:grid-cols-2" onSubmit={submit} noValidate>
          {errors.form ? (
            <p
              role="alert"
              aria-live="polite"
              className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errors.form}
            </p>
          ) : null}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="payment-student">Student</Label>
            <Select
              value={studentId}
              onValueChange={(value) => {
                setStudentId(value);
                setErrors((prev) => ({ ...prev, studentId: undefined, form: undefined }));
              }}
              disabled={mode === 'edit'}
            >
              <SelectTrigger
                id="payment-student"
                aria-label="Select student for payment"
                className="h-11"
                aria-invalid={Boolean(errors.studentId)}
                aria-describedby={errors.studentId ? 'payment-student-error' : undefined}
              >
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {liveStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} — Class {student.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.studentId ? (
              <p id="payment-student-error" role="alert" className="text-xs text-destructive">
                {errors.studentId}
              </p>
            ) : null}
            {mode === 'edit' ? (
              <p className="text-xs text-muted-foreground">Student is locked while editing an existing payment.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-type">Payment Type</Label>
            <Select
              value={paymentType}
              onValueChange={(value) => {
                setPaymentType(value as PaymentType);
                setErrors((prev) => ({ ...prev, form: undefined }));
              }}
            >
              <SelectTrigger id="payment-type" aria-label="Select payment type" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canUseYearlyForSelectedStudent ? <SelectItem value="yearly">Yearly</SelectItem> : null}
                <SelectItem value="half_yearly">Half Yearly</SelectItem>
              </SelectContent>
            </Select>
            {!canUseYearlyForSelectedStudent ? (
              <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                Yearly option is hidden because this student already has a half-yearly installment.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Amount (₹)</Label>
            <Input
              id="payment-amount"
              type="number"
              inputMode="numeric"
              min={0}
              value={amount}
              onChange={(event) => {
                setAmount(Number(event.target.value || 0));
                setErrors((prev) => ({ ...prev, amount: undefined, form: undefined }));
              }}
              className="h-11"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'payment-amount-error' : undefined}
            />
            {errors.amount ? (
              <p id="payment-amount-error" role="alert" className="text-xs text-destructive">
                {errors.amount}
              </p>
            ) : null}
            {selectedClassFee ? (
              <p className="text-xs text-muted-foreground">
                Class {selectedStudent?.class} fee rule: {formatCurrency(selectedClassFee)} yearly /{' '}
                {formatCurrency(deriveHalfYearlyFee(selectedClassFee))} half-yearly.
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="payment-date">Payment Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(event) => {
                setPaymentDate(event.target.value);
                setErrors((prev) => ({ ...prev, paymentDate: undefined, form: undefined }));
              }}
              className="h-11"
              aria-invalid={Boolean(errors.paymentDate)}
              aria-describedby={errors.paymentDate ? 'payment-date-error' : undefined}
            />
            {errors.paymentDate ? (
              <p id="payment-date-error" role="alert" className="text-xs text-destructive">
                {errors.paymentDate}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="payment-notes">Notes</Label>
            <Textarea
              id="payment-notes"
              placeholder="Optional notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[88px]"
            />
          </div>

          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpenState(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : mode === 'edit' ? 'Update Payment' : 'Save Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
