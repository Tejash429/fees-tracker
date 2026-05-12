'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { OverflowMenu } from '@/components/shared/overflow-menu';
import { PaymentDetailsSheet } from '@/components/payments/payment-details-sheet';
import { RecordPaymentDialog } from '@/components/payments/record-payment-dialog';
import { DeletePaymentButton } from '@/components/payments/delete-payment-button';
import { fetchPaymentsByStudentClient } from '@/lib/query-client-fetchers';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { PaymentWithStudent, Student } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function StudentDetailsContent({
  student,
  initialPayments
}: {
  student: Student;
  initialPayments: PaymentWithStudent[];
}) {
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Class</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{student.class}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalCollected)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Last Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{latestPayment ? formatDate(latestPayment.payment_date) : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Last updated: {formatDateTime(dataUpdatedAt || Date.now())}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isFetching ? (
              <Badge variant="secondary" role="status" aria-live="polite">
                Updating...
              </Badge>
            ) : null}
            <RecordPaymentDialog students={[student]} payments={studentPayments} defaultStudentId={student.id} />
          </div>
        </CardHeader>
        <CardContent>
          {!studentPayments.length ? (
            <EmptyState
              title="No payments yet"
              description="Record the first payment to start this student's history."
              action={<RecordPaymentDialog students={[student]} payments={studentPayments} defaultStudentId={student.id} />}
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {studentPayments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant={payment.payment_type === 'yearly' ? 'default' : 'secondary'}>
                        {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                      </Badge>
                      <p className="font-semibold tabular-nums">{formatCurrency(payment.amount)}</p>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>Date: {formatDate(payment.payment_date)}</p>
                      <p>
                        Period: {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                      </p>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <OverflowMenu label={`Actions for payment on ${formatDate(payment.payment_date)}`}>
                        <PaymentDetailsSheet
                          payment={payment}
                          trigger={
                            <Button size="sm" variant="ghost" className="w-full justify-start">
                              View details
                            </Button>
                          }
                        />
                        <RecordPaymentDialog
                          mode="edit"
                          payment={payment}
                          students={[student]}
                          payments={studentPayments}
                          trigger={
                            <Button size="sm" variant="ghost" className="w-full justify-start">
                              Edit payment
                            </Button>
                          }
                        />
                        <DeletePaymentButton
                          paymentId={payment.id}
                          trigger={
                            <Button size="sm" variant="ghost" className="w-full justify-start text-destructive">
                              Delete payment
                            </Button>
                          }
                        />
                      </OverflowMenu>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Badge variant={payment.payment_type === 'yearly' ? 'default' : 'secondary'}>
                            {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>
                          {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <OverflowMenu label={`Actions for payment on ${formatDate(payment.payment_date)}`}>
                            <PaymentDetailsSheet
                              payment={payment}
                              trigger={
                                <Button size="sm" variant="ghost" className="w-full justify-start">
                                  View details
                                </Button>
                              }
                            />
                            <RecordPaymentDialog
                              mode="edit"
                              payment={payment}
                              students={[student]}
                              payments={studentPayments}
                              trigger={
                                <Button size="sm" variant="ghost" className="w-full justify-start">
                                  Edit payment
                                </Button>
                              }
                            />
                            <DeletePaymentButton
                              paymentId={payment.id}
                              trigger={
                                <Button size="sm" variant="ghost" className="w-full justify-start text-destructive">
                                  Delete payment
                                </Button>
                              }
                            />
                          </OverflowMenu>
                        </TableCell>
                      </TableRow>
                    ))}
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
