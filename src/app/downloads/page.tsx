import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'My Downloads' };

export default async function DownloadsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="wrap pt-32 pb-20">
        <h1 className="font-display text-3xl mb-2">My downloads</h1>
        <p className="text-ink-faint mb-8">Licensed offline playback — links expire per title for security.</p>
        <EmptyState title="Nothing downloaded yet" message="Authorized downloads you request from any title page will be available directly." />
      </div>
    );
  }

  const { data: logs } = await supabase
    .from('download_access_logs')
    .select('*, download_options(quality, format, content_type, content_id)')
    .eq('user_id', user.id)
    .order('signed_url_issued_at', { ascending: false })
    .limit(30);

  return (
    <div className="wrap pt-32 pb-20">
      <h1 className="font-display text-3xl mb-2">My downloads</h1>
      <p className="text-ink-faint mb-8">Licensed offline playback — links expire per title for security.</p>

      {(logs ?? []).length === 0 ? (
        <EmptyState title="Nothing downloaded yet" message="Authorized downloads you request from a movie or episode page will be logged here." />
      ) : (
        <div className="flex flex-col gap-2 max-w-2xl">
          {logs!.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between p-4 rounded-lg border border-line bg-bg-card">
              <div>
                <p className="font-semibold text-sm">{log.download_options?.quality} · {log.download_options?.format?.toUpperCase()}</p>
                <p className="text-ink-faint text-xs">Requested {formatRelativeTime(log.signed_url_issued_at)} · expired {formatRelativeTime(log.expires_at)}</p>
              </div>
              <span className="text-ink-faint text-xs border border-line rounded px-2 py-1">Link expired</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
