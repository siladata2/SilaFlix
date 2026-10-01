import { createAdminClient } from '@/lib/supabase/admin';
import { AppSettingsForm } from '@/components/admin/AppSettingsForm';
import { BackButton } from '@/components/ui/BackButton';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from('app_settings').select('*');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-white font-bold">App & Wallpaper Settings</h1>
          <p className="text-xs text-ink-faint mt-1">
            Configure your startup fullscreen wallpaper, splash duration (2–4 seconds), and platform contact details.
          </p>
        </div>
        <BackButton fallbackHref="/admin" label="Back to Studio" />
      </div>
      <AppSettingsForm settings={settings ?? []} />
    </div>
  );
}
