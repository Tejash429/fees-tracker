import { AnalyticsPageContent } from '@/components/dashboard/analytics-page-content';
import { getAnalyticsData } from '@/lib/queries';

export default async function AnalyticsPage() {
  const initialData = await getAnalyticsData();

  return <AnalyticsPageContent initialData={initialData} />;
}
