import { createClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/admin/DataTable';
import { NewCategoryForm } from '@/components/admin/NewCategoryForm';

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Categories</h1>
      <div className="mb-8"><NewCategoryForm /></div>
      <DataTable
        columns={['Name', 'Slug']}
        rows={categories ?? []}
        emptyMessage="No categories yet."
        renderRow={(c) => (
          <tr key={c.id}>
            <td className="px-4 py-3 font-medium">{c.name}</td>
            <td className="px-4 py-3 text-ink-faint">{c.slug}</td>
          </tr>
        )}
      />
    </div>
  );
}
