'use client';

import Link from 'next/link';
import { ExternalLink, Printer, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { printPaymentReceipt } from '@/components/payments/payment-receipt';
import { PaymentDetailsSheet } from '@/components/payments/payment-details-sheet';
import { formatCurrency, formatDate, getAvatarColor, getInitials } from '@/lib/utils';
import { PaymentWithStudent } from '@/types';

export function RecentPaymentsTable({ payments }: { payments: PaymentWithStudent[] }) {
  return (
    <>
      {/* Mobile Card View */}
      <div className="space-y-3 sm:hidden">
        {payments.map((payment) => {
          const studentName = payment.students?.name || 'Unknown Student';
          const avatarColor = getAvatarColor(studentName);
          const initials = getInitials(studentName);

          return (
            <div
              key={payment.id}
              className="rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-xs transition-colors hover:border-border"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${avatarColor}`}
                  >
                    {initials}
                  </div>
                  <div>
                    {payment.students?.id ? (
                      <Link
                        href={`/students/${payment.students.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {studentName}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{studentName}</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Class {payment.students?.class ?? '—'}
                    </p>
                  </div>
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

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                <div>
                  <span>Paid on:</span>
                  <p className="font-medium text-foreground">{formatDate(payment.payment_date)}</p>
                </div>
                <div>
                  <span>Amount:</span>
                  <p className="font-semibold tabular-nums text-foreground">{formatCurrency(payment.amount)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => printPaymentReceipt(payment)}
                >
                  <Printer className="h-3 w-3" />
                  Slip
                </Button>
                <PaymentDetailsSheet
                  payment={payment}
                  trigger={
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                      Details
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
              <TableHead className="w-[280px]">Student</TableHead>
              <TableHead className="w-[100px]">Class</TableHead>
              <TableHead className="w-[130px]">Plan Type</TableHead>
              <TableHead className="w-[180px]">Coverage Period</TableHead>
              <TableHead className="w-[130px]">Date</TableHead>
              <TableHead className="w-[130px] text-right">Amount</TableHead>
              <TableHead className="w-[140px] text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const studentName = payment.students?.name || 'Unknown Student';
              const avatarColor = getAvatarColor(studentName);
              const initials = getInitials(studentName);

              return (
                <TableRow key={payment.id} className="border-border/40 hover:bg-muted/30">
                  {/* Student */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${avatarColor}`}
                      >
                        {initials}
                      </div>
                      <div>
                        {payment.students?.id ? (
                          <Link
                            href={`/students/${payment.students.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {studentName}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground">{studentName}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Class */}
                  <TableCell className="py-3">
                    <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">
                      Class {payment.students?.class ?? '—'}
                    </span>
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

                  {/* Coverage Period */}
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    <span className="text-foreground">{formatDate(payment.period_start)}</span>
                    <span className="mx-1 text-muted-foreground/60">→</span>
                    <span className="text-foreground">{formatDate(payment.period_end)}</span>
                  </TableCell>

                  {/* Payment Date */}
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {formatDate(payment.payment_date)}
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="py-3 text-right font-semibold tabular-nums text-foreground">
                    {formatCurrency(payment.amount)}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => printPaymentReceipt(payment)}
                        title="Print Fee Slip"
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
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
