import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';
import { PublishToggle } from '@/components/admin/PublishToggle';
import { Plus } from 'lucide-react';

export default async function AdminRecapsPage() {
  const supabase = createClient();
  const { data: recaps } = await supabase.from('recaps').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Video Recaps Management</h1>
          <p className="text-ink-faint text-xs mt-1">Manage film summaries, recap videos (MP4, M3U8, MPD), and optional download links.</p>
        </div>
        <Link
          href="/admin/recaps/new"
          className="bg-gold text-[#171412] font-semibold rounded-lg px-4 py-2 text-sm hover:bg-[#f0b25a] flex items-center gap-1.5"
        >
          <Plus size={16} /> New Recap
        </Link>
      </div>

      <DataTable
        columns={['Title', 'Language', 'Status', 'Published']}
        rows={recaps ?? []}
        emptyMessage="No recaps yet — add your first recap."
        renderRow={(r) => (
          <tr key={r.id}>
            <td className="px-4 py-3 font-medium">
              <div className="flex items-center gap-3">
                {r.thumbnail_url && (
                  <img src={r.thumbnail_url} alt="" className="w-12 h-8 object-cover rounded bg-black/40" />
                )}
                <div>
                  <p className="text-sm text-ink">{r.title}</p>
                  <p className="text-xs text-ink-faint truncate max-w-xs">{r.video_url || '—'}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-ink-faint">{r.language}</td>
            <td className="px-4 py-3 text-ink-faint capitalize">{r.status}</td>
            <td className="px-4 py-3"><PublishToggle table="recaps" id={r.id} isPublished={r.is_published} /></td>
          </tr>
        )}
      />
    </div>
  );
}
