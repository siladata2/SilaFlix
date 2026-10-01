import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { MovieCard } from '@/components/home/MovieCard';
import { SeriesCard } from '@/components/home/SeriesCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Movie, Series } from '@/lib/types/database';

export const metadata: Metadata = { title: 'My List' };

export default async function WatchlistPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="wrap pt-32 pb-20">
        <h1 className="font-display text-3xl mb-8">My List</h1>
        <EmptyState title="Your list is empty" message="Browse movies and series to discover great entertainment." />
      </div>
    );
  }

  const { data: items } = await supabase.from('watchlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  const movieIds = (items ?? []).filter((i) => i.content_type === 'movie').map((i) => i.content_id);
  const seriesIds = (items ?? []).filter((i) => i.content_type === 'series').map((i) => i.content_id);

  const [{ data: movies }, { data: series }] = await Promise.all([
    movieIds.length ? supabase.from('movies').select('*').in('id', movieIds) : Promise.resolve({ data: [] }),
    seriesIds.length ? supabase.from('series').select('*').in('id', seriesIds) : Promise.resolve({ data: [] }),
  ]);

  const isEmpty = (movies ?? []).length === 0 && (series ?? []).length === 0;

  return (
    <div className="wrap pt-32 pb-20">
      <h1 className="font-display text-3xl mb-8">My List</h1>
      {isEmpty ? (
        <EmptyState title="Your list is empty" message="Tap + My List on any movie or series to save it here for later." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(movies as Movie[] ?? []).map((m) => <MovieCard key={m.id} movie={m} />)}
          {(series as Series[] ?? []).map((s) => <SeriesCard key={s.id} series={s} />)}
        </div>
      )}
    </div>
  );
}
