import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';
import { PublishToggle } from '@/components/admin/PublishToggle';
import { Plus } from 'lucide-react';

export default async function AdminEpisodesPage() {
  const supabase = createClient();
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*, series(title), seasons(season_number)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Episodes Management</h1>
          <p className="text-ink-faint text-xs mt-1">Manage series episodes, file uploads, Google Drive sources, and download options.</p>
        </div>
        <Link
          href="/admin/episodes/new"
          className="bg-gold text-[#171412] font-semibold rounded-lg px-4 py-2 text-sm hover:bg-[#f0b25a] flex items-center gap-1.5"
        >
          <Plus size={16} /> New Episode
        </Link>
      </div>

      <DataTable
        columns={['Series', 'Season', 'Ep #', 'Title', 'Published']}
        rows={episodes ?? []}
        emptyMessage="No episodes yet — add your first episode."
        renderRow={(e: any) => (
          <tr key={e.id}>
            <td className="px-4 py-3 font-medium">{e.series?.title}</td>
            <td className="px-4 py-3 text-ink-faint">S{e.seasons?.season_number ?? 1}</td>
            <td className="px-4 py-3 text-ink-faint">E{e.episode_number}</td>
            <td className="px-4 py-3 font-semibold text-ink">{e.title}</td>
            <td className="px-4 py-3"><PublishToggle table="episodes" id={e.id} isPublished={e.is_published} /></td>
          </tr>
        )}
      />
    </div>
  );
}
