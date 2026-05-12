'use client';

import { ReactNode } from 'react';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentWithStudent } from '@/types';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 rounded-md border border-border/70 p-3 sm:grid-cols-[160px_1fr] sm:items-center">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function PaymentDetailsSheet({ payment, trigger }: { payment: PaymentWithStudent; trigger?: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="sm" className="h-11 gap-1" aria-label="View payment details">
            <Eye className="h-4 w-4" aria-hidden="true" />
            View
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payment Details</SheetTitle>
          <SheetDescription>Review full payment record, student info, period, and notes.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <section className="space-y-3" aria-label="Student information">
            <h3 className="text-sm font-semibold text-foreground">Student</h3>
            <DetailRow label="Student" value={payment.students?.name || 'Unknown'} />
            <DetailRow
              label="Class"
              value={<Badge variant="outline">Class {payment.students?.class || '-'}</Badge>}
            />
            <DetailRow label="Parent Name" value={payment.students?.parent_name || '—'} />
            <DetailRow label="Phone" value={payment.students?.phone || '—'} />
          </section>

          <section className="space-y-3" aria-label="Payment summary">
            <h3 className="text-sm font-semibold text-foreground">Payment Summary</h3>
            <DetailRow
              label="Payment Type"
              value={
                <Badge variant={payment.payment_type === 'yearly' ? 'default' : 'secondary'}>
                  {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                </Badge>
              }
            />
            <DetailRow label="Amount" value={<span className="font-semibold">{formatCurrency(payment.amount)}</span>} />
            <DetailRow label="Payment Date" value={formatDate(payment.payment_date)} />
            <DetailRow label="Period Start" value={formatDate(payment.period_start)} />
            <DetailRow label="Period End" value={formatDate(payment.period_end)} />
            <DetailRow label="Recorded At" value={formatDate(payment.created_at)} />
          </section>

          <section className="space-y-3" aria-label="Additional notes">
            <h3 className="text-sm font-semibold text-foreground">Notes</h3>
            <DetailRow label="Notes" value={payment.notes?.trim() || 'No notes'} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
