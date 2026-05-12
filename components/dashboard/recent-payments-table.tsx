import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentWithStudent } from '@/types';

export function RecentPaymentsTable({ payments }: { payments: PaymentWithStudent[] }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-lg border border-border/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{payment.students?.name || 'Unknown Student'}</p>
                <p className="text-xs text-muted-foreground">Class {payment.students?.class ?? '-'}</p>
              </div>
              <Badge variant={payment.payment_type === 'yearly' ? 'default' : 'secondary'}>
                {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
              </Badge>
            </div>

            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>Date: {formatDate(payment.payment_date)}</p>
              <p>
                Period: {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
              </p>
            </div>

            <p className="mt-2 font-semibold">{formatCurrency(payment.amount)}</p>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.students?.name || 'Unknown Student'}</TableCell>
                <TableCell>
                  <Badge variant="outline">Class {payment.students?.class ?? '-'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={payment.payment_type === 'yearly' ? 'default' : 'secondary'}>
                    {payment.payment_type === 'yearly' ? 'Yearly' : 'Half Yearly'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                </TableCell>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(payment.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
