import { PageHeader } from '@/components/shared/page-header';
import { FeeSettingsForm } from '@/components/settings/fee-settings-form';
import { getFeeSettings } from '@/lib/fee-settings';

export default async function SettingsPage() {
  const initialSettings = await getFeeSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure class-wise yearly fee rules for Class 9 and Class 10."
      />

      <FeeSettingsForm initialSettings={initialSettings} />
    </div>
  );
}
