import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';
import { DownloadApproval } from '@/components/admin/DownloadApproval';
import { formatFileSize } from '@/lib/utils';

export default async function AdminDownloadsPage() {
  const supabase = createClient();
  const { data: options } = await supabase.from('download_options').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Download options</h1>
      <p className="text-ink-faint text-sm mb-6">Approve a download only once you&apos;ve confirmed SilaFlix has distribution rights for that file.</p>
      <DataTable
        columns={['Content', 'Quality', 'Format', 'Size', 'Status', '']}
        rows={options ?? []}
        emptyMessage="No download options submitted yet."
        renderRow={(o) => (
          <tr key={o.id}>
            <td className="px-4 py-3 text-ink-faint">{o.content_type} · {o.content_id.slice(0, 8)}</td>
            <td className="px-4 py-3">{o.quality}</td>
            <td className="px-4 py-3 text-ink-faint">{o.format.toUpperCase()}</td>
            <td className="px-4 py-3 text-ink-faint">{formatFileSize(o.file_size_bytes)}</td>
            <td className="px-4 py-3 capitalize text-ink-faint">{o.authorization_status}</td>
            <td className="px-4 py-3 text-right"><DownloadApproval id={o.id} status={o.authorization_status} /></td>
          </tr>
        )}
      />
    </div>
  );
}
