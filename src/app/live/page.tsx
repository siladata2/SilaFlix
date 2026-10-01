import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SILAFLIX_CATALOG, type CatalogEntry } from '@/lib/streamCatalog';
import { LiveTvClient } from '@/components/live/LiveTvClient';
import { BackButton } from '@/components/ui/BackButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live TV Channels — SilaFlix',
  description: 'Watch 24/7 Live TV channels, music, sports, cartoons, and international entertainment on SilaFlix',
};

export default async function LiveTvPage() {
  const supabase = createClient();

  const orderedChannels: (CatalogEntry & { status?: string; isPaid?: boolean; updatedAt?: string })[] = [];
  const seenSlugs = new Set<string>();

  // 1. Load live channels from DB ordered by updated_at DESC so newly added or recently updated channels appear first
  try {
    const { data: dbLive } = await supabase
      .from('movies')
      .select('*, movie_sources(external_id, quality)')
      .ilike('content_rating', '%LIVE%')
      .order('updated_at', { ascending: false });

    if (dbLive) {
      dbLive.forEach((m: any, idx: number) => {
        if (m.status === 'offline' || m.is_published === false) {
          seenSlugs.add(m.slug);
          return;
        }

        const catalogMatch = SILAFLIX_CATALOG.find(
          (c) => c.slug === m.slug && c.kind === 'live'
        );
        const sources = (m.movie_sources as any[]) || [];
        const primaryStream =
          sources[0]?.external_id || m.trailer_url || catalogMatch?.stream_url || '';
        if (!primaryStream) return;

        const isPaid =
          m.status === 'paid' || Boolean(m.content_rating?.toUpperCase().includes('VIP'));
        const isMaint =
          m.status === 'maintenance' ||
          Boolean(m.content_rating?.toUpperCase().includes('MAINTENANCE'));
        const computedStatus = isMaint ? 'maintenance' : m.status || 'published';

        seenSlugs.add(m.slug);
        orderedChannels.push({
          title: m.title || catalogMatch?.title || 'Live Channel',
          slug: m.slug,
          kind: 'live',
          category: 'Live TV',
          categorySlug: 'live-tv',
          channel_number: catalogMatch?.channel_number || 101 + idx,
          synopsis:
            m.synopsis ||
            catalogMatch?.synopsis ||
            '24/7 live television broadcast on SilaFlix.',
          poster_url:
            m.poster_url ||
            catalogMatch?.poster_url ||
            'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
          backdrop_url:
            m.backdrop_url ||
            m.poster_url ||
            catalogMatch?.backdrop_url ||
            'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1600&q=80',
          stream_url: primaryStream,
          raw_url: primaryStream,
          secondary_sources:
            sources.length > 1
              ? sources.slice(1).map((s) => ({
                  quality: s.quality || 'Live',
                  url: s.external_id,
                }))
              : catalogMatch?.secondary_sources,
          enable_download: false,
          release_year: m.release_year || 2026,
          runtime_minutes: null,
          language: m.language || catalogMatch?.language || 'English',
          content_rating: m.content_rating || 'LIVE',
          status: computedStatus,
          isPaid,
          updatedAt: m.updated_at,
        });
      });
    }
  } catch {
    // Use catalog fallback below
  }

  // 2. Append any remaining catalog live channels not already handled above
  SILAFLIX_CATALOG.filter((item) => item.kind === 'live').forEach((c) => {
    if (!seenSlugs.has(c.slug)) {
      orderedChannels.push({ ...c, status: 'published', isPaid: false });
    }
  });

  return (
    <div className="min-h-screen bg-bg text-ink pt-24 pb-24 wrap">
      <div className="mb-5">
        <BackButton fallbackHref="/" label="Back to Home" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#e50914] font-semibold uppercase tracking-wider mb-1">
            <Radio size={14} className="animate-pulse" />
            <span>24/7 Live Television</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">
            Live TV Channels
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-ink-dim max-w-md">
          Select any channel below to open its dedicated live broadcast player.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-64 rounded-xl bg-bg-card border border-line flex items-center justify-center text-sm text-ink-dim">
            Loading Live TV Channels...
          </div>
        }
      >
        <LiveTvClient channels={orderedChannels} />
      </Suspense>
    </div>
  );
}
