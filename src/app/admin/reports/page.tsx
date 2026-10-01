import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';
import { ReportResolution } from '@/components/admin/ReportResolution';

export default async function AdminReportsPage() {
  const supabase = createClient();
  const { data: reports } = await supabase.from('reports').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Reports</h1>
      <DataTable
        columns={['Content', 'Reason', 'Status', '']}
        rows={reports ?? []}
        emptyMessage="No reports filed."
        renderRow={(r) => (
          <tr key={r.id}>
            <td className="px-4 py-3 text-ink-faint">{r.content_type} · {r.content_id.slice(0, 8)}</td>
            <td className="px-4 py-3">{r.reason}</td>
            <td className="px-4 py-3 capitalize text-ink-faint">{r.status}</td>
            <td className="px-4 py-3 text-right"><ReportResolution id={r.id} status={r.status} /></td>
          </tr>
        )}
      />
    </div>
  );
}
