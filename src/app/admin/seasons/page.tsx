import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';

export default async function AdminSeasonsPage() {
  const supabase = createClient();
  const { data: seasons } = await supabase.from('seasons').select('*, series(title)').order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Seasons</h1>
      <DataTable
        columns={['Series', 'Season #', 'Title']}
        rows={seasons ?? []}
        emptyMessage="No seasons yet — create a series first, then add seasons to it."
        renderRow={(s: any) => (
          <tr key={s.id}>
            <td className="px-4 py-3 font-medium">{s.series?.title}</td>
            <td className="px-4 py-3 text-ink-faint">{s.season_number}</td>
            <td className="px-4 py-3 text-ink-faint">{s.title ?? '—'}</td>
          </tr>
        )}
      />
    </div>
  );
}
