import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Tv, Play } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Series & TV Shows - SilaFlix',
  description: 'Watch TV series, seasons, and episodes on SilaFlix',
};

export default async function SeriesListingPage() {
  const supabase = createClient();
  const { data: series } = await supabase
    .from('series')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-bg text-ink pt-24 pb-24 wrap">
      <div className="mb-5">
        <BackButton fallbackHref="/" label="Back to Home" />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">All Series & TV Shows</h1>
          <p className="text-sm text-ink-dim mt-1">
            Immerse yourself in gripping serialized drama, weekly episodes, and seasons.
          </p>
        </div>
      </div>

      {(series ?? []).length === 0 ? (
        <div className="bg-bg-card border border-line rounded-xl p-12 text-center text-ink-dim text-sm">
          <Tv size={36} className="mx-auto mb-2 text-ink-faint" />
          No series published yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {series!.map((show) => (
            <Link
              key={show.id}
              href={`/series/${show.slug}`}
              className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-gold/50 transition-all shadow-sm"
            >
              <div className="aspect-[2/3] relative bg-bg-raised overflow-hidden">
                {show.poster_url ? (
                  <img
                    src={show.poster_url}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-faint">
                    <Tv size={24} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gold text-[#171412] flex items-center justify-center shadow-lg">
                    <Play size={18} className="fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-xs text-white truncate group-hover:text-gold transition-colors">
                  {show.title}
                </h3>
                <div className="flex items-center justify-between mt-1 text-[11px] text-ink-faint">
                  <span>Series</span>
                  {show.content_rating && (
                    <span className="border border-line px-1 rounded text-[10px]">
                      {show.content_rating}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
