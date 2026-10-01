import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MovieCard } from '@/components/home/MovieCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackButton } from '@/components/ui/BackButton';
import { SILAFLIX_CATALOG } from '@/lib/streamCatalog';
import type { Movie } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!category) notFound();

  const { data: joinedMovies } = await supabase
    .from('movies')
    .select('*, content_categories!inner(categories!inner(slug))')
    .eq('is_published', true)
    .eq('content_categories.categories.slug', params.slug);

  let movies: Movie[] = (joinedMovies as Movie[]) || [];

  // Fallback by matching catalog slugs if join table is empty for this category
  if (movies.length === 0) {
    const matchingSlugs = SILAFLIX_CATALOG.filter((c) => c.categorySlug === params.slug).map(
      (c) => c.slug
    );
    if (matchingSlugs.length > 0) {
      const { data: fallbackMovies } = await supabase
        .from('movies')
        .select('*')
        .eq('is_published', true)
        .in('slug', matchingSlugs);
      movies = (fallbackMovies as Movie[]) || [];
    }
  }

  return (
    <div className="wrap pt-24 pb-20 space-y-6">
      <BackButton fallbackHref="/categories" label="Back to Categories" />
      <div>
        <h1 className="font-display text-3xl mb-2">{category.name}</h1>
        {category.description && <p className="text-ink-faint">{category.description}</p>}
      </div>
      {movies.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          message="Titles tagged with this category will appear here."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </div>
  );
}
