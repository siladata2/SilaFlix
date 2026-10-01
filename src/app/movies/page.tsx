import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Film, Play, Lock, Wrench } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Movies — SilaFlix',
  description: 'Browse and watch full-length movies and cinema releases on SilaFlix',
};

export default async function MoviesListingPage() {
  const supabase = createClient();
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', true)
    .order('updated_at', { ascending: false });

  const allItems = movies ?? [];
  // Strictly feature movies only — Live TV channels stay exclusively on /live
  const featureMovies = allItems.filter(
    (m) => !(m.content_rating || '').toUpperCase().includes('LIVE')
  );

  return (
    <div className="min-h-screen bg-bg text-ink pt-24 pb-24 wrap space-y-8">
      <div>
        <BackButton fallbackHref="/" label="Back to Home" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs text-gold font-semibold uppercase tracking-wider mb-1">
            <Film size={14} />
            <span>Cinema Collection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">Movies</h1>
          <p className="text-sm text-ink-dim mt-1">
            Watch the latest feature films, action blockbusters, and international cinema releases.
          </p>
        </div>
        <span className="text-xs text-ink-faint font-medium">
          {featureMovies.length} {featureMovies.length === 1 ? 'Title' : 'Titles'} Available
        </span>
      </div>

      {featureMovies.length === 0 ? (
        <div className="bg-bg-card border border-line rounded-xl p-12 text-center text-ink-dim text-sm">
          <Film size={36} className="mx-auto mb-2 text-ink-faint" />
          No movies published yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {featureMovies.map((movie) => {
            const rating = (movie.content_rating || '').toUpperCase();
            const isVip = rating.includes('VIP') || movie.status === 'paid';
            const isMaint = rating.includes('MAINTENANCE');

            return (
              <Link
                key={movie.id}
                href={`/movies/${movie.slug}`}
                className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-gold/50 transition-all shadow-sm"
              >
                <div className="aspect-[2/3] relative bg-bg-raised overflow-hidden">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-faint">
                      <Film size={24} />
                    </div>
                  )}

                  {isVip && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-gold text-[#171412] px-2 py-0.5 rounded text-[10px] font-bold">
                      <Lock size={10} /> VIP
                    </div>
                  )}

                  {isMaint && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/85 text-amber-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                      <Wrench size={10} /> MAINTENANCE
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gold text-[#171412] flex items-center justify-center shadow-lg">
                      <Play size={18} className="fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-xs sm:text-sm text-white truncate group-hover:text-gold transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink-faint">
                    <span>{movie.release_year || 2026}</span>
                    {movie.content_rating && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{movie.content_rating}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
