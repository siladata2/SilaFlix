import { createAdminClient } from '@/lib/supabase/admin';
import { DataTable } from '@/components/admin/DataTable';
import { ModerationActions } from '@/components/admin/ModerationActions';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminReelsPage() {
  const admin = createAdminClient();
  const { data: reels } = await admin
    .from('reels')
    .select('*, profiles(display_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackHref="/admin" label="Back" />
          <div>
            <h1 className="font-display text-2xl text-white font-bold">Reels Management</h1>
            <p className="text-ink-faint text-xs mt-0.5">
              Upload TikTok-style vertical reels, Google Drive clips, or YouTube Shorts.
            </p>
          </div>
        </div>
        <Link
          href="/admin/reels/new"
          className="bg-gold text-[#171412] font-semibold rounded-lg px-4 py-2 text-sm hover:bg-[#f0b25a] flex items-center gap-1.5"
        >
          <Plus size={16} /> New Reel
        </Link>
      </div>

      <DataTable
        columns={['Title', 'Creator', 'Status', '']}
        rows={reels ?? []}
        emptyMessage="No reels submitted yet — add your first reel."
        renderRow={(r: any) => (
          <tr key={r.id}>
            <td className="px-4 py-3 font-medium">
              <div className="flex items-center gap-2">
                {r.thumbnail_url && (
                  <img
                    src={r.thumbnail_url}
                    alt=""
                    className="w-8 h-12 object-cover rounded bg-black/40"
                  />
                )}
                <div>
                  <p className="text-sm text-ink">{r.title}</p>
                  <p className="text-xs text-ink-faint truncate max-w-xs">{r.video_url}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-ink-faint">{r.profiles?.display_name ?? 'Admin'}</td>
            <td className="px-4 py-3 text-ink-faint capitalize">
              {r.is_published ? 'Published' : r.status}
            </td>
            <td className="px-4 py-3 text-right">
              <ModerationActions table="reels" id={r.id} />
            </td>
          </tr>
        )}
      />
    </div>
  );
}
