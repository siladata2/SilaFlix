import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { HeroBanner } from '@/components/home/HeroBanner';
import { Film, Tv, Clapperboard, Sparkles, Play, Radio, Clock } from 'lucide-react';
import type { Movie, Series, Reel, Category } from '@/lib/types/database';
import { SILAFLIX_CATALOG } from '@/lib/streamCatalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();

  let movies: Movie[] = [];
  let series: Series[] = [];
  let reels: Reel[] = [];
  let categories: Category[] = [];

  try {
    const [moviesRes, seriesRes, reelsRes, categoriesRes] = await Promise.all([
      supabase
        .from('movies')
        .select('*')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(40),
      supabase
        .from('series')
        .select('*')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(12),
      supabase
        .from('reels')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })
        .limit(12),
    ]);

    movies = (moviesRes.data as Movie[]) || [];
    series = (seriesRes.data as Series[]) || [];
    reels = (reelsRes.data as Reel[]) || [];
    categories = (categoriesRes.data as Category[]) || [];
  } catch (err) {
    console.error('Error loading homepage data:', err);
  }

  // Separate movies and live streams for dedicated rows, while keeping `movies` as the mixed update-ordered feed
  const featureMovies = movies.filter(
    (m) => !(m.content_rating || '').toUpperCase().includes('LIVE')
  );
  const dbLiveChannels = movies.filter((m) =>
    (m.content_rating || '').toUpperCase().includes('LIVE')
  );

  // Mixed feed of Movies + Live Channels ordered strictly by updated_at descending
  const mixedLatestFeed = movies.slice(0, 12);

  const featuredItem =
    featureMovies.find((m) => m.is_featured) ||
    featureMovies[0] ||
    movies[0] ||
    series[0] ||
    null;

  return (
    <div className="min-h-screen bg-bg text-ink pb-24">
      {/* Hero Section */}
      {featuredItem ? (
        <HeroBanner item={featuredItem} />
      ) : (
        <div className="relative pt-32 pb-20 px-4 wrap text-center border-b border-line/40">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-gold mb-4">
            <Sparkles size={14} /> Welcome to SilaFlix
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight text-white mb-4">
            Unlimited Movies, Live TV & Series
          </h1>
          <p className="text-base sm:text-lg text-ink-dim max-w-2xl mx-auto mb-8">
            Watch full-length movies, 24/7 live television channels, drama series, and short reels anytime, anywhere.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 bg-gold text-[#171412] font-semibold px-6 py-3 rounded-xl hover:bg-[#f0b25a] transition-all shadow-md"
            >
              <Film size={18} />
              Browse Movies
            </Link>
            <Link
              href="/live"
              className="inline-flex items-center gap-2 bg-bg-card border border-line text-white font-semibold px-6 py-3 rounded-xl hover:border-gold/50 transition-all"
            >
              <Radio size={18} className="text-[#e50914]" />
              Watch Live TV
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="wrap mt-10 space-y-14">
        {/* Categories & Live Quick Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Link
            href="/live"
            className="flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 transition-colors inline-flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live TV ({dbLiveChannels.length || SILAFLIX_CATALOG.filter((c) => c.kind === 'live').length})
          </Link>
          <Link
            href="/movies"
            className="flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-bg-card border border-line text-ink-dim hover:text-gold hover:border-gold/40 transition-colors"
          >
            Movies ({featureMovies.length})
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex-none px-3.5 py-1.5 rounded-lg text-xs bg-bg-card border border-line text-ink-dim hover:text-gold hover:border-gold/40 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* 1. MIXED LATEST UPDATES FEED (Movies + Live Streams sorted by latest update) */}
        {mixedLatestFeed.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Clock size={20} className="text-gold" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                    Latest Updates & Now Streaming
                  </h2>
                  <p className="text-xs text-ink-dim">
                    Recently added and updated movies and live TV channels
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mixedLatestFeed.map((item) => {
                const isLive = (item.content_rating || '').toUpperCase().includes('LIVE');
                const href = isLive ? `/live/${item.slug}` : `/movies/${item.slug}`;

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`group block bg-bg-card rounded-xl overflow-hidden border border-line transition-all shadow-sm ${
                      isLive ? 'hover:border-[#e50914]/60' : 'hover:border-gold/50'
                    }`}
                  >
                    <div className="aspect-[2/3] relative bg-bg-raised overflow-hidden">
                      {item.poster_url || item.backdrop_url ? (
                        <img
                          src={item.poster_url || item.backdrop_url || ''}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-faint">
                          {isLive ? <Radio size={24} /> : <Film size={24} />}
                        </div>
                      )}

                      <div className="absolute top-2 left-2">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 bg-[#e50914] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            LIVE TV
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-black/80 text-gold px-2 py-0.5 rounded text-[10px] font-semibold">
                            MOVIE
                          </span>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                            isLive ? 'bg-[#e50914] text-white' : 'bg-gold text-[#171412]'
                          }`}
                        >
                          <Play size={18} className="fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-xs text-white truncate group-hover:text-gold transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink-faint">
                        <span>{isLive ? '24/7 Live' : item.release_year || 2026}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{item.language || 'English'}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Live TV Channels Section */}
        {dbLiveChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Radio size={20} className="text-red-400 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                  Live TV Channels
                </h2>
              </div>
              <Link href="/live" className="text-xs font-semibold text-gold hover:underline">
                View All Channels ({dbLiveChannels.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dbLiveChannels.slice(0, 8).map((channel, idx) => {
                const catMatch = SILAFLIX_CATALOG.find((c) => c.slug === channel.slug);
                const chNum = catMatch?.channel_number || 101 + idx;
                return (
                  <Link
                    key={channel.id}
                    href={`/live/${channel.slug}`}
                    className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-[#e50914]/60 transition-all shadow-sm"
                  >
                    <div className="aspect-video relative bg-bg-raised overflow-hidden">
                      <img
                        src={channel.backdrop_url || channel.poster_url || ''}
                        alt={channel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span>LIVE · CH {chNum}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg">
                          <Play size={18} className="fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-semibold text-sm text-white truncate group-hover:text-gold transition-colors">
                        {channel.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink-faint">
                        <span className="text-red-400 font-medium">On Air</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{channel.language || 'International'}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Feature Movies Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Film size={20} className="text-gold" />
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                Featured Movies
              </h2>
            </div>
            <Link href="/movies" className="text-xs font-semibold text-gold hover:underline">
              View All Movies →
            </Link>
          </div>

          {featureMovies.length === 0 ? (
            <div className="bg-bg-card border border-line rounded-xl p-8 text-center text-ink-dim text-sm">
              <Film size={32} className="mx-auto mb-2 text-ink-faint" />
              No movies published yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featureMovies.map((movie) => (
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-gold text-[#171412] flex items-center justify-center shadow-lg">
                        <Play size={18} className="fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-xs text-white truncate group-hover:text-gold transition-colors">
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
              ))}
            </div>
          )}
        </div>

        {/* 4. Popular Series */}
        {series.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Tv size={20} className="text-gold" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                  Popular Series
                </h2>
              </div>
              <Link href="/series" className="text-xs font-semibold text-gold hover:underline">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {series.map((show) => (
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
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-xs text-white truncate group-hover:text-gold transition-colors">
                      {show.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-ink-faint">
                      <span>Series</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5. Trending Reels */}
        {reels.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Clapperboard size={20} className="text-gold" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                  Trending Reels
                </h2>
              </div>
              <Link href="/reels" className="text-xs font-semibold text-gold hover:underline">
                Watch All Reels →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {reels.map((reel) => (
                <Link
                  key={reel.id}
                  href={`/reels?id=${reel.id}`}
                  className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-gold/50 transition-all relative aspect-[9/16]"
                >
                  {reel.thumbnail_url ? (
                    <img
                      src={reel.thumbnail_url}
                      alt={reel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-bg-raised flex items-center justify-center">
                      <Clapperboard size={32} className="text-ink-faint" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex flex-col justify-end">
                    <p className="text-xs font-semibold text-white line-clamp-2">{reel.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
