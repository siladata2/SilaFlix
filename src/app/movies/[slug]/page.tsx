import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { DownloadList } from '@/components/DownloadList';
import { InlineSecurePlayer, type SecureStreamFeed } from '@/components/player/InlineSecurePlayer';
import { BackButton } from '@/components/ui/BackButton';
import { encodeStreamToken } from '@/lib/videoUtils';
import { SILAFLIX_CATALOG } from '@/lib/streamCatalog';
import { Film, Globe, Shield, Download, Play } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const admin = createAdminClient();
  const { data: movie } = await admin
    .from('movies')
    .select('title, synopsis')
    .eq('slug', params.slug)
    .maybeSingle();

  const fallback = SILAFLIX_CATALOG.find((c) => c.slug === params.slug);

  return {
    title: movie?.title
      ? `${movie.title} — Watch on SilaFlix`
      : fallback
      ? `${fallback.title} — Watch on SilaFlix`
      : 'Watch Movie — SilaFlix',
    description: movie?.synopsis || fallback?.synopsis || 'Watch movies and series on SilaFlix',
  };
}

export default async function MovieDetailPage({ params }: { params: { slug: string } }) {
  const admin = createAdminClient();

  const { data: dbMovie } = await admin
    .from('movies')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  const catalogMatch = SILAFLIX_CATALOG.find((c) => c.slug === params.slug);

  if (!dbMovie && !catalogMatch) {
    notFound();
  }

  const contentRating = dbMovie?.content_rating || catalogMatch?.content_rating || 'PG-13';
  const isLive = contentRating.toUpperCase().includes('LIVE') || catalogMatch?.kind === 'live';

  if (isLive) {
    redirect(`/live/${params.slug}`);
  }

  const movieId = dbMovie?.id || '';
  const title = dbMovie?.title || catalogMatch?.title || 'Movie';
  const synopsis =
    dbMovie?.synopsis || catalogMatch?.synopsis || 'Stream full HD entertainment on SilaFlix.';
  const posterUrl = dbMovie?.poster_url || catalogMatch?.poster_url || '';
  const backdropUrl = dbMovie?.backdrop_url || catalogMatch?.backdrop_url || posterUrl;
  const releaseYear = dbMovie?.release_year || catalogMatch?.release_year || 2026;
  const runtimeMinutes = dbMovie?.runtime_minutes ?? catalogMatch?.runtime_minutes ?? null;
  const language = dbMovie?.language || catalogMatch?.language || 'English';
  const status =
    dbMovie?.is_published === false
      ? 'offline'
      : contentRating.toUpperCase().includes('MAINTENANCE')
      ? 'maintenance'
      : dbMovie?.status || 'published';
  const isPaid =
    status === 'paid' ||
    contentRating.toUpperCase().includes('VIP') ||
    contentRating.toUpperCase().includes('PAID');

  let sources: any[] = [];
  let downloadOptions: any[] = [];

  if (movieId) {
    const [sourcesRes, dlRes] = await Promise.all([
      admin
        .from('movie_sources')
        .select('*')
        .eq('movie_id', movieId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      admin
        .from('download_options')
        .select('*')
        .eq('content_type', 'movie')
        .eq('content_id', movieId)
        .eq('authorization_status', 'approved')
        .eq('is_active', true),
    ]);
    sources = sourcesRes.data || [];
    downloadOptions = dlRes.data || [];
  }

  const rawPrimaryUrl =
    sources[0]?.external_id ||
    catalogMatch?.stream_url ||
    dbMovie?.trailer_url ||
    '';

  const primaryTokenOrUrl = encodeStreamToken(rawPrimaryUrl);
  const primaryQuality = sources[0]?.quality || '1080p';

  const extraFeeds: SecureStreamFeed[] = sources.slice(1).map((s, idx) => {
    const u = s.external_id || '';
    return {
      label: `Server ${idx + 2} (${s.quality || 'HD'})`,
      tokenOrUrl: encodeStreamToken(u),
    };
  });

  const allowDownload = movieId
    ? downloadOptions.length > 0
    : Boolean(catalogMatch?.enable_download);

  const rawDownloadUrl =
    downloadOptions[0]?.protected_file_reference ||
    catalogMatch?.download_url ||
    rawPrimaryUrl;
  const downloadToken = allowDownload ? encodeStreamToken(rawDownloadUrl) : '';
  const directDownloadHref = downloadToken
    ? `/api/downloads/direct?token=${encodeURIComponent(downloadToken)}&title=${encodeURIComponent(title)}`
    : '';

  const { data: relatedDb } = await admin
    .from('movies')
    .select('*')
    .eq('is_published', true)
    .neq('slug', params.slug)
    .order('updated_at', { ascending: false })
    .limit(18);

  const relatedMovies = ((relatedDb as any[]) || [])
    .filter((m) => !(m.content_rating || '').toUpperCase().includes('LIVE'))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-bg text-ink pt-24 pb-24 wrap space-y-10">
      {/* Top Navigation Row with Back Button */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/movies" label="Back to Movies" />

        <div className="flex items-center gap-2 text-xs text-ink-dim">
          <span>{releaseYear}</span>
          <span aria-hidden="true">·</span>
          <span>{contentRating}</span>
          {runtimeMinutes && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {Math.floor(runtimeMinutes / 60)}h {runtimeMinutes % 60}m
              </span>
            </>
          )}
        </div>
      </div>

      {/* Full-Width Player + Clean Description + Single Bottom Download Section */}
      <div className="max-w-5xl mx-auto space-y-6">
        <InlineSecurePlayer
          title={title}
          poster={backdropUrl}
          primaryTokenOrUrl={primaryTokenOrUrl}
          feeds={extraFeeds}
          downloadToken={downloadToken}
          allowDownload={allowDownload}
          isLive={false}
          status={status}
          isPaid={isPaid}
        />

        {/* Clean Movie Description Card (Poster image removed so description is clear and wide) */}
        <div className="bg-bg-card border border-line rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-dim">
              <span className="text-[#e50914] font-bold uppercase">Feature Film</span>
              <span aria-hidden="true">·</span>
              <span>{releaseYear}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Globe size={13} /> {language}
              </span>
              {runtimeMinutes && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Film size={13} /> {Math.floor(runtimeMinutes / 60)}h {runtimeMinutes % 60}m
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="text-gold font-semibold inline-flex items-center gap-1">
                <Shield size={13} /> {contentRating}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
            {title}
          </h1>

          <p className="text-ink-dim text-sm sm:text-base leading-relaxed">{synopsis}</p>
        </div>

        {/* Single Bottom Download Section — Shows Quality Number Only (No MB/GB sizes) */}
        {allowDownload && (
          <div className="bg-bg-card border border-line rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Download size={17} className="text-[#e50914]" />
              Download Movie
            </h2>
            {downloadOptions.length > 0 ? (
              <DownloadList options={downloadOptions as any} />
            ) : (
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-line bg-bg">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold text-xs tracking-wide">
                    {primaryQuality}
                  </span>
                  <span className="text-ink-dim text-xs font-medium">{language}</span>
                </div>
                <a
                  href={directDownloadHref}
                  download
                  className="inline-flex items-center gap-2 bg-bg-card border border-line hover:border-ink-dim text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all"
                >
                  <Download size={15} />
                  <span>Download ({primaryQuality})</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RELATED MOVIES ONLY */}
      {relatedMovies.length > 0 && (
        <div className="pt-8 border-t border-line space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film size={20} className="text-gold" />
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                More Movies Like This
              </h2>
            </div>
            <Link href="/movies" className="text-xs font-semibold text-gold hover:underline">
              View All Movies →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {relatedMovies.map((m) => (
              <Link
                key={m.id}
                href={`/movies/${m.slug}`}
                className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-gold/50 transition-all"
              >
                <div className="aspect-[2/3] relative bg-bg-raised overflow-hidden">
                  {m.poster_url ? (
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-faint">
                      <Film size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gold text-[#171412] flex items-center justify-center shadow-lg">
                      <Play size={16} className="fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="font-semibold text-xs text-white truncate group-hover:text-gold transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-[10px] text-ink-faint mt-0.5">{m.release_year || 2026}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
