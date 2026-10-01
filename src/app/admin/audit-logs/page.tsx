import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';
import { formatRelativeTime } from '@/lib/utils';

export default async function AdminAuditLogsPage() {
  const supabase = createClient();
  const { data: logs } = await supabase.from('audit_logs').select('*, profiles(display_name)').order('created_at', { ascending: false }).limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Audit logs</h1>
      <DataTable
        columns={['Actor', 'Action', 'Entity', 'When']}
        rows={logs ?? []}
        emptyMessage="No audit events recorded yet."
        renderRow={(l: any) => (
          <tr key={l.id}>
            <td className="px-4 py-3">{l.profiles?.display_name ?? 'System'}</td>
            <td className="px-4 py-3 text-ink-faint">{l.action}</td>
            <td className="px-4 py-3 text-ink-faint">{l.entity_type}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ''}</td>
            <td className="px-4 py-3 text-ink-faint">{formatRelativeTime(l.created_at)}</td>
          </tr>
        )}
      />
    </div>
  );
}
