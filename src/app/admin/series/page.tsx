import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';
import { PublishToggle } from '@/components/admin/PublishToggle';
import { Plus } from 'lucide-react';

export default async function AdminSeriesPage() {
  const supabase = createClient();
  const { data: series } = await supabase.from('series').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Series Management</h1>
          <p className="text-ink-faint text-xs mt-1">Manage TV shows, cover images, and seasons.</p>
        </div>
        <Link
          href="/admin/series/new"
          className="bg-gold text-[#171412] font-semibold rounded-lg px-4 py-2 text-sm hover:bg-[#f0b25a] flex items-center gap-1.5"
        >
          <Plus size={16} /> New Series
        </Link>
      </div>

      <DataTable
        columns={['Title', 'Status', 'Featured', 'Published']}
        rows={series ?? []}
        emptyMessage="No series yet — create your first series."
        renderRow={(s) => (
          <tr key={s.id}>
            <td className="px-4 py-3 font-medium">
              <div className="flex items-center gap-3">
                {s.poster_url && (
                  <img src={s.poster_url} alt="" className="w-8 h-12 object-cover rounded bg-black/40" />
                )}
                <div>
                  <p className="text-sm text-ink">{s.title}</p>
                  <p className="text-xs text-ink-faint">/{s.slug}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-ink-faint capitalize">{s.status}</td>
            <td className="px-4 py-3 text-gold">{s.is_featured ? '★ Featured' : '—'}</td>
            <td className="px-4 py-3"><PublishToggle table="series" id={s.id} isPublished={s.is_published} /></td>
          </tr>
        )}
      />
    </div>
  );
}
