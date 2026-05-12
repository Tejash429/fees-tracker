import { PageHeader } from '@/components/shared/page-header';
import { PendingTable } from '@/components/payments/pending-table';
import { getPendingStudentsData } from '@/lib/queries';

export default async function PendingPage() {
  const pendingRows = await getPendingStudentsData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Dues"
        description="Students with expired payment periods or no payment history."
      />

      <PendingTable initialPendingRows={pendingRows} />
    </div>
  );
}
