import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackButton } from '@/components/ui/BackButton';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div className="wrap pt-24 pb-20 space-y-6">
      <BackButton fallbackHref="/" label="Back to Home" />
      <h1 className="font-display text-3xl">Browse Categories</h1>
      {(categories ?? []).length === 0 ? (
        <EmptyState title="No categories yet" message="Categories created in the admin dashboard will appear here." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories!.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="relative aspect-video rounded-xl overflow-hidden border border-line bg-bg-card flex items-end p-4 hover:border-gold/40">
              <span className="font-display text-lg relative z-10">{c.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
