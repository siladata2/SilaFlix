import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Radio, Globe, Shield, Tv, Play } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { SILAFLIX_CATALOG } from '@/lib/streamCatalog';
import { encodeStreamToken } from '@/lib/videoUtils';
import { InlineSecurePlayer, type SecureStreamFeed } from '@/components/player/InlineSecurePlayer';
import { BackButton } from '@/components/ui/BackButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const catalogMatch = SILAFLIX_CATALOG.find((c) => c.slug === params.slug);
  return {
    title: catalogMatch ? `${catalogMatch.title} — Live TV | SilaFlix` : 'Live Channel | SilaFlix',
    description: catalogMatch?.synopsis || 'Watch 24/7 Live TV on SilaFlix',
  };
}

export default async function LiveChannelWatchPage({ params }: { params: { slug: string } }) {
  const admin = createAdminClient();

  const { data: dbMovie } = await admin
    .from('movies')
    .select('*, movie_sources(*)')
    .eq('slug', params.slug)
    .maybeSingle();

  const catalogChannel = SILAFLIX_CATALOG.find((c) => c.slug === params.slug);

  if (!dbMovie && !catalogChannel) {
    notFound();
  }

  const title = dbMovie?.title || catalogChannel?.title || 'Live Channel';
  const synopsis =
    dbMovie?.synopsis ||
    catalogChannel?.synopsis ||
    '24/7 live television broadcast on SilaFlix.';
  const poster = dbMovie?.poster_url || catalogChannel?.poster_url || '';
  const backdrop = dbMovie?.backdrop_url || catalogChannel?.backdrop_url || poster;
  const language = dbMovie?.language || catalogChannel?.language || 'International';
  const channelNumber = catalogChannel?.channel_number || 101;
  const contentRating = dbMovie?.content_rating || catalogChannel?.content_rating || 'LIVE';
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

  const dbSources = ((dbMovie as any)?.movie_sources as any[]) || [];
  const rawPrimaryUrl =
    dbSources[0]?.external_id ||
    catalogChannel?.stream_url ||
    dbMovie?.trailer_url ||
    '';

  const isEmbedSource =
    rawPrimaryUrl.includes('youtube.com') ||
    rawPrimaryUrl.includes('youtu.be') ||
    rawPrimaryUrl.includes('youtube-nocookie.com');

  const primaryTokenOrUrl = isEmbedSource
    ? rawPrimaryUrl
    : encodeStreamToken(rawPrimaryUrl);

  const extraFeeds: SecureStreamFeed[] = [];
  if (dbSources.length > 1) {
    dbSources.slice(1).forEach((s, i) => {
      const url = s.external_id || '';
      const isEmb = url.includes('youtube') || url.includes('youtu.be');
      extraFeeds.push({
        label: `Server ${i + 2} (${s.quality || 'Live'})`,
        tokenOrUrl: isEmb ? url : encodeStreamToken(url),
      });
    });
  } else if (catalogChannel?.secondary_sources) {
    catalogChannel.secondary_sources.forEach((s, i) => {
      const isEmb = s.url.includes('youtube') || s.url.includes('youtu.be');
      extraFeeds.push({
        label: `Server ${i + 2} (${s.quality})`,
        tokenOrUrl: isEmb ? s.url : encodeStreamToken(s.url),
      });
    });
  }

  // Load Related Live Channels ONLY (no movies mixed in), ordered by latest update
  const { data: relatedDbLive } = await admin
    .from('movies')
    .select('*')
    .eq('is_published', true)
    .ilike('content_rating', '%LIVE%')
    .neq('slug', params.slug)
    .order('updated_at', { ascending: false })
    .limit(8);

  const relatedChannels =
    relatedDbLive && relatedDbLive.length > 0
      ? relatedDbLive.map((m: any, idx: number) => {
          const catMatch = SILAFLIX_CATALOG.find((c) => c.slug === m.slug);
          return {
            slug: m.slug,
            title: m.title,
            synopsis: m.synopsis || catMatch?.synopsis || '24/7 Live TV',
            backdrop_url: m.backdrop_url || m.poster_url || catMatch?.backdrop_url || '',
            poster_url: m.poster_url || catMatch?.poster_url || '',
            channel_number: catMatch?.channel_number || 101 + idx,
          };
        })
      : SILAFLIX_CATALOG.filter((c) => c.kind === 'live' && c.slug !== params.slug).slice(0, 8);

  return (
    <div className="min-h-screen bg-bg text-ink pt-24 pb-24 wrap space-y-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/live" label="Back to Live Channels" />

        <div className="flex items-center gap-2 text-xs text-ink-dim">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-semibold">CH {channelNumber}</span>
          <span aria-hidden="true">·</span>
          <span>{language}</span>
        </div>
      </div>

      {/* Dedicated Channel Player + Clean Description (No side thumbnail blocking description) */}
      <div className="max-w-5xl mx-auto space-y-6">
        <InlineSecurePlayer
          title={title}
          poster={backdrop}
          primaryTokenOrUrl={primaryTokenOrUrl}
          feeds={extraFeeds}
          allowDownload={false}
          isLive={true}
          status={status}
          isPaid={isPaid}
        />

        <div className="bg-bg-card border border-line rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#e50914]">
              <Radio size={14} className="animate-pulse" />
              <span>LIVE TV · CH {channelNumber}</span>
              <span className="text-ink-dim">·</span>
              <span className="text-ink-dim flex items-center gap-1">
                <Globe size={13} /> {language}
              </span>
            </div>
            <span className="text-xs text-green-400 font-semibold uppercase flex items-center gap-1.5">
              <Shield size={13} />
              {status === 'maintenance'
                ? 'Maintenance'
                : isPaid
                ? 'VIP Channel'
                : 'On Air · 24/7 Live'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white leading-snug">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-ink-dim leading-relaxed">{synopsis}</p>
        </div>
      </div>

      {/* RELATED LIVE CHANNELS ONLY */}
      <div className="pt-8 border-t border-line space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv size={20} className="text-[#e50914]" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
              More Live TV Channels
            </h2>
          </div>
          <Link href="/live" className="text-xs font-semibold text-gold hover:underline">
            View All Channels →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {relatedChannels.map((ch) => (
            <Link
              key={ch.slug}
              href={`/live/${ch.slug}`}
              className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-[#e50914]/60 transition-all"
            >
              <div className="aspect-video relative bg-bg-raised overflow-hidden">
                <img
                  src={ch.backdrop_url || ch.poster_url}
                  alt={ch.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  CH {ch.channel_number || 100}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg">
                    <Play size={16} className="fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-xs sm:text-sm text-white truncate group-hover:text-[#e50914] transition-colors">
                  {ch.title}
                </h3>
                <p className="text-[11px] text-ink-faint truncate mt-0.5">{ch.synopsis}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
