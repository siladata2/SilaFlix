import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { SeriesWatchClient, type SeriesEpisodeView } from '@/components/player/SeriesWatchClient';
import { BackButton } from '@/components/ui/BackButton';
import { encodeStreamToken } from '@/lib/videoUtils';
import { Tv, Play } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const admin = createAdminClient();
  const { data: series } = await admin
    .from('series')
    .select('title, synopsis')
    .eq('slug', params.slug)
    .maybeSingle();

  return {
    title: series?.title ? `${series.title} — Series on SilaFlix` : 'Watch Series — SilaFlix',
    description: series?.synopsis || 'Stream full seasons and episodes on SilaFlix.',
  };
}

export default async function SeriesDetailPage({ params }: { params: { slug: string } }) {
  const admin = createAdminClient();

  const { data: series } = await admin
    .from('series')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!series) {
    notFound();
  }

  const [{ data: rawEpisodes }, { data: dlOptions }, { data: relatedSeries }] = await Promise.all([
    admin
      .from('episodes')
      .select('*')
      .eq('series_id', series.id)
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true }),
    admin
      .from('download_options')
      .select('*')
      .eq('content_type', 'episode')
      .eq('authorization_status', 'approved')
      .eq('is_active', true),
    admin
      .from('series')
      .select('*')
      .eq('is_published', true)
      .neq('slug', params.slug)
      .order('updated_at', { ascending: false })
      .limit(6),
  ]);

  const dlMap = new Map<string, { url: string; quality: string }>();
  (dlOptions || []).forEach((d: any) => {
    if (d.content_id && d.protected_file_reference) {
      dlMap.set(d.content_id, {
        url: d.protected_file_reference,
        quality: d.quality || '1080p',
      });
    }
  });

  const episodes: SeriesEpisodeView[] = ((rawEpisodes as any[]) || []).map((ep) => {
    const rawUrl = ep.video_url || series.trailer_url || '';
    const dlEntry = dlMap.get(ep.id);
    const hasDownload = Boolean(dlEntry);
    return {
      id: ep.id,
      season_number: ep.season_number || 1,
      episode_number: ep.episode_number || 1,
      title: ep.title || `Episode ${ep.episode_number || 1}`,
      synopsis: ep.synopsis || null,
      runtime_minutes: ep.runtime_minutes || null,
      thumbnail_url: ep.thumbnail_url || series.backdrop_url || series.poster_url || null,
      streamToken: encodeStreamToken(rawUrl),
      downloadToken: hasDownload ? encodeStreamToken(dlEntry!.url || rawUrl) : undefined,
      allowDownload: hasDownload,
      quality: dlEntry?.quality || '1080p',
    };
  });

  const fallbackToken = encodeStreamToken(series.trailer_url || '');

  return (
    <div className="min-h-screen bg-bg text-ink pt-24 pb-24 wrap space-y-10">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/series" label="Back to Series" />

        <div className="flex items-center gap-2 text-xs text-ink-dim">
          <span className="text-gold font-semibold uppercase flex items-center gap-1">
            <Tv size={13} /> Series
          </span>
          {series.release_year && (
            <>
              <span aria-hidden="true">·</span>
              <span>{series.release_year}</span>
            </>
          )}
          {series.content_rating && (
            <>
              <span aria-hidden="true">·</span>
              <span>{series.content_rating}</span>
            </>
          )}
        </div>
      </div>

      {/* Clean Series Header Card (Poster image removed so description is clear) */}
      <div className="max-w-5xl mx-auto bg-bg-card border border-line rounded-2xl p-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-dim">
          <span className="px-2 py-0.5 rounded bg-gold/15 text-gold font-bold uppercase text-[10px]">
            Full Series
          </span>
          {series.release_year && <span>{series.release_year}</span>}
          {series.language && (
            <>
              <span aria-hidden="true">·</span>
              <span>{series.language}</span>
            </>
          )}
          {series.content_rating && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-gold font-semibold">{series.content_rating}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="text-white font-semibold">{episodes.length} Episodes</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
          {series.title}
        </h1>

        {series.synopsis && (
          <p className="text-sm sm:text-base text-ink-dim leading-relaxed">
            {series.synopsis}
          </p>
        )}
      </div>

      {/* Interactive Episode Player & Season Selector */}
      <div className="max-w-5xl mx-auto">
        <SeriesWatchClient
          seriesTitle={series.title}
          posterUrl={series.backdrop_url || series.poster_url}
          fallbackToken={fallbackToken}
          episodes={episodes}
          status={series.is_published === false ? 'offline' : series.status || 'published'}
        />
      </div>

      {/* Related Series */}
      {relatedSeries && relatedSeries.length > 0 && (
        <div className="pt-8 border-t border-line space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Tv size={19} className="text-gold" /> More Series on SilaFlix
            </h2>
            <Link href="/series" className="text-xs font-semibold text-gold hover:underline">
              All Series →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {relatedSeries.map((s: any) => (
              <Link
                key={s.id}
                href={`/series/${s.slug}`}
                className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-gold/50 transition-all"
              >
                <div className="aspect-[2/3] relative bg-bg-raised overflow-hidden">
                  {s.poster_url ? (
                    <img
                      src={s.poster_url}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-faint">
                      <Tv size={24} />
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
                    {s.title}
                  </h3>
                  <p className="text-[10px] text-ink-faint mt-0.5">{s.release_year || 2026}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
