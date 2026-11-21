'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Download,
  Eye,
  Pencil,
  Phone,
  Plus,
  Printer,
  Receipt,
  User,
  Wallet
} from 'lucide-react';

import { exportToExcel } from '@/lib/export';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { OverflowMenu } from '@/components/shared/overflow-menu';
import { PaymentDetailsSheet } from '@/components/payments/payment-details-sheet';
import { printPaymentReceipt } from '@/components/payments/payment-receipt';
import { RecordPaymentDialog } from '@/components/payments/record-payment-dialog';
import { DeletePaymentButton } from '@/components/payments/delete-payment-button';
import { StudentFormSheet } from '@/components/students/student-form-sheet';
import { DeleteStudentButton } from '@/components/students/delete-student-button';
import { fetchPaymentsByStudentClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getAvatarColor,
  getInitials,
  sanitizePhone
} from '@/lib/utils';
import { PaymentWithStudent, Student } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export function StudentDetailsContent({
  student,
  initialPayments
}: {
  student: Student;
  initialPayments: PaymentWithStudent[];
}) {
  const router = useRouter();

  const { data: payments = initialPayments, isFetching, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.paymentsByStudent(student.id),
    queryFn: () => fetchPaymentsByStudentClient(student.id),
    initialData: initialPayments
  });

  const studentPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()),
    [payments]
  );

  const totalCollected = useMemo(
    () => studentPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [studentPayments]
  );

  const latestPayment = studentPayments[0] || null;

  // Determine coverage status
  const coverageStatus = useMemo(() => {
    if (!latestPayment) {
      return { status: 'never_paid', label: 'No payments recorded', isCovered: false };
    }
    const today = new Date().toISOString().split('T')[0];
    const isCovered = latestPayment.period_end >= today;
    return {
      status: isCovered ? 'active' : 'expired',
      label: isCovered ? `Covered till ${formatDate(latestPayment.period_end)}` : `Expired on ${formatDate(latestPayment.period_end)}`,
      isCovered
    };
  }, [latestPayment]);

  const avatarColor = getAvatarColor(student.name);
  const initials = getInitials(student.name);

  const handleExport = () => {
    const exportRows = studentPayments.map((p) => ({
      'Receipt #': `REC-${p.id.slice(0, 6).toUpperCase()}`,
      'Plan Type': p.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly',
      'Amount (INR)': p.amount,
      'Payment Date': formatDate(p.payment_date),
      'Period Start': formatDate(p.period_start),
      'Period End': formatDate(p.period_end),
      'Notes': p.notes || '—'
    }));
    exportToExcel(
      exportRows,
      `${student.name.replace(/\s+/g, '_')}_Payments_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link href="/students">
            <ChevronLeft className="h-4 w-4" />
            Back to Students
          </Link>
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isFetching && (
            <span role="status" aria-live="polite">
              Syncing…
            </span>
          )}
          <span>Updated {formatDateTime(dataUpdatedAt || Date.now())}</span>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/60 to-card/40 p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Avatar & Student Info */}
          <div className="flex items-start gap-4 sm:items-center">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 text-xl font-bold shadow-xs sm:h-20 sm:w-20 sm:text-2xl ${avatarColor}`}
            >
              {initials}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {student.name}
                </h1>
                <span className="rounded-md border border-border/60 bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  Class {student.class}
                </span>
                {coverageStatus.isCovered ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Fees Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
                    <AlertCircle className="h-3 w-3" />
                    Fee Due
                  </span>
                )}
              </div>

              {/* Contact & Enrollment Info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {student.phone ? (
                  <a
                    href={`tel:${sanitizePhone(student.phone)}`}
                    className="inline-flex items-center gap-1 text-foreground hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {student.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground/60">No phone provided</span>
                )}
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Enrolled {formatDate(student.enrollment_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <RecordPaymentDialog
              students={[student]}
              payments={studentPayments}
              defaultStudentId={student.id}
              trigger={
                <Button className="h-9 gap-1.5 text-xs font-medium shadow-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Record Payment
                </Button>
              }
            />

            <StudentFormSheet
              mode="edit"
              student={student}
              trigger={
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              }
            />

            <DeleteStudentButton
              studentId={student.id}
              studentName={student.name}
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Collected */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Paid</span>
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {formatCurrency(totalCollected)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Lifetime payments</p>
        </div>

        {/* Total Transactions */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Payments</span>
            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {studentPayments.length}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Total receipts issued</p>
        </div>

        {/* Active Coverage Till */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Coverage Till</span>
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm font-bold tracking-tight text-foreground sm:text-base">
            {latestPayment ? formatDate(latestPayment.period_end) : '—'}
          </p>
          <p
            className={`mt-0.5 text-[11px] font-medium ${
              coverageStatus.isCovered ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {coverageStatus.label}
          </p>
        </div>

        {/* Last Payment Date */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Last Paid On</span>
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm font-bold tracking-tight text-foreground sm:text-base">
            {latestPayment ? formatDate(latestPayment.payment_date) : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {latestPayment ? formatCurrency(latestPayment.amount) : 'No transactions'}
          </p>
        </div>
      </div>

      {/* Payment History Ledger */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Payment History</CardTitle>
            <p className="text-xs text-muted-foreground">
              Complete transaction ledger and receipt slips for {student.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!studentPayments.length}
              className="h-8 gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!studentPayments.length ? (
            <EmptyState
              title="No payments recorded"
              description="Record the first fee payment for this student to generate receipt and coverage."
              action={
                <RecordPaymentDialog
                  students={[student]}
                  payments={studentPayments}
                  defaultStudentId={student.id}
                  trigger={
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Record First Payment
                    </Button>
                  }
                />
              }
            />
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="space-y-3 sm:hidden">
                {studentPayments.map((payment) => {
                  const receiptNo = `REC-${payment.id.slice(0, 6).toUpperCase()}`;

                  return (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-xs transition-colors hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-semibold text-muted-foreground">
                            {receiptNo}
                          </span>
                          <p className="mt-1 font-semibold tabular-nums text-foreground">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            payment.payment_type === 'yearly'
                              ? 'border border-primary/30 bg-primary/10 text-primary'
                              : 'border border-sky-500/30 bg-sky-500/10 text-sky-400'
                          }`}
                        >
                          {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                        <div>
                          <span>Paid on:</span>
                          <p className="font-medium text-foreground">{formatDate(payment.payment_date)}</p>
                        </div>
                        <div>
                          <span>Coverage period:</span>
                          <p className="font-medium text-foreground">
                            {formatDate(payment.period_start)} → {formatDate(payment.period_end)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/40 pt-2.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-xs"
                          onClick={() => printPaymentReceipt(payment)}
                        >
                          <Printer className="h-3 w-3" />
                          Slip
                        </Button>
                        <PaymentDetailsSheet
                          payment={payment}
                          trigger={
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                              View
                            </Button>
                          }
                        />
                        <RecordPaymentDialog
                          mode="edit"
                          payment={payment}
                          students={[student]}
                          payments={studentPayments}
                          trigger={
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                              Edit
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card/40 sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[120px]">Receipt #</TableHead>
                      <TableHead className="w-[120px]">Plan Type</TableHead>
                      <TableHead className="w-[130px]">Date</TableHead>
                      <TableHead className="w-[200px]">Coverage Period</TableHead>
                      <TableHead className="w-[130px] text-right">Amount</TableHead>
                      <TableHead className="w-[170px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentPayments.map((payment) => {
                      const receiptNo = `REC-${payment.id.slice(0, 6).toUpperCase()}`;

                      return (
                        <TableRow key={payment.id} className="border-border/40 hover:bg-muted/30">
                          {/* Receipt # */}
                          <TableCell className="py-3 font-mono text-xs font-semibold text-muted-foreground">
                            {receiptNo}
                          </TableCell>

                          {/* Plan Type */}
                          <TableCell className="py-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                payment.payment_type === 'yearly'
                                  ? 'border border-primary/30 bg-primary/10 text-primary'
                                  : 'border border-sky-500/30 bg-sky-500/10 text-sky-400'
                              }`}
                            >
                              {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                            </span>
                          </TableCell>

                          {/* Payment Date */}
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {formatDate(payment.payment_date)}
                          </TableCell>

                          {/* Coverage Period */}
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            <span className="text-foreground">{formatDate(payment.period_start)}</span>
                            <span className="mx-1 text-muted-foreground/60">→</span>
                            <span className="text-foreground">{formatDate(payment.period_end)}</span>
                          </TableCell>

                          {/* Amount */}
                          <TableCell className="py-3 text-right font-semibold tabular-nums text-foreground">
                            {formatCurrency(payment.amount)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => printPaymentReceipt(payment)}
                                title="Print Payment Slip"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                Slip
                              </Button>

                              <PaymentDetailsSheet
                                payment={payment}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    View
                                  </Button>
                                }
                              />

                              <OverflowMenu label={`More actions for receipt ${receiptNo}`}>
                                <RecordPaymentDialog
                                  mode="edit"
                                  payment={payment}
                                  students={[student]}
                                  payments={studentPayments}
                                  trigger={
                                    <Button size="sm" variant="ghost" className="w-full justify-start text-xs">
                                      Edit payment
                                    </Button>
                                  }
                                />
                                <DeletePaymentButton
                                  paymentId={payment.id}
                                  trigger={
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="w-full justify-start text-xs text-destructive hover:text-destructive"
                                    >
                                      Delete payment
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
