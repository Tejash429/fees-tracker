import { DashboardPageContent } from '@/components/dashboard/dashboard-page-content';
import { getDashboardData } from '@/lib/queries';

export default async function DashboardPage() {
  const initialData = await getDashboardData();

  return <DashboardPageContent initialData={initialData} />;
}
