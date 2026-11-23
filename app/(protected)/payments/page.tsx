import { PageHeader } from '@/components/shared/page-header';
import { PaymentsTable } from '@/components/payments/payments-table';
import { RecordPaymentDialog } from '@/components/payments/record-payment-dialog';
import { getPaymentsTableData } from '@/lib/queries';
import { PaymentType, PaymentsSortBy, SortDirection, StudentClass } from '@/types';

interface PaymentsPageProps {
  searchParams?: {
    q?: string;
    class?: string;
    type?: string;
    page?: string;
    sortBy?: string;
    sortDir?: string;
  };
}

const paymentSortFields: PaymentsSortBy[] = ['payment_date', 'amount', 'period_end', 'created_at'];

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const search = searchParams?.q || '';
  const classFilter: 'all' | StudentClass =
    searchParams?.class === '9' || searchParams?.class === '10' ? searchParams.class : 'all';

  const typeFilter: 'all' | PaymentType =
    searchParams?.type === 'yearly' || searchParams?.type === 'half_yearly' ? searchParams.type : 'all';

  const page = Number(searchParams?.page || 1);

  const requestedSortBy = searchParams?.sortBy as PaymentsSortBy | undefined;
  const sortBy: PaymentsSortBy =
    requestedSortBy && paymentSortFields.includes(requestedSortBy) ? requestedSortBy : 'payment_date';

  const sortDir: SortDirection = searchParams?.sortDir === 'asc' ? 'asc' : 'desc';

  const paymentsData = await getPaymentsTableData({
    search,
    classFilter,
    typeFilter,
    page,
    pageSize: 10,
    sortBy,
    sortDir
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View all transactions, apply filters, and record fee payments."
        actions={<RecordPaymentDialog />}
      />

      <PaymentsTable initialData={paymentsData} />
    </div>
  );
}
