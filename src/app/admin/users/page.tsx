import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';
import { RoleSelect } from '@/components/admin/RoleSelect';

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Users</h1>
      <DataTable
        columns={['Name', 'Username', 'Role', 'Joined']}
        rows={users ?? []}
        emptyMessage="No users yet."
        renderRow={(u) => (
          <tr key={u.id}>
            <td className="px-4 py-3 font-medium">{u.display_name}</td>
            <td className="px-4 py-3 text-ink-faint">{u.username ?? '—'}</td>
            <td className="px-4 py-3"><RoleSelect userId={u.user_id} currentRole={u.role} /></td>
            <td className="px-4 py-3 text-ink-faint">{new Date(u.created_at).toLocaleDateString()}</td>
          </tr>
        )}
      />
    </div>
  );
}
