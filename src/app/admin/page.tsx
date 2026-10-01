import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { SimpleContentManager, type AdminMovieItem } from '@/components/admin/SimpleContentManager';
import { SilaFlixLogo } from '@/components/ui/SilaFlixLogo';
import {
  Tv,
  Layers,
  Clapperboard,
  Newspaper,
  Tags,
  Download,
  Flag,
  Settings,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let items: AdminMovieItem[] = [];
  let platformMode = 'online';
  let counts = {
    movies: 0,
    liveChannels: 0,
    series: 0,
    reels: 0,
    downloads: 0,
  };

  try {
    const admin = createAdminClient();
    const [moviesRes, seriesRes, reelsRes, downloadsRes, settingsRes] = await Promise.all([
      admin
        .from('movies')
        .select('*, movie_sources(external_id)')
        .order('updated_at', { ascending: false })
        .limit(100),
      admin.from('series').select('id', { count: 'exact', head: true }),
      admin.from('reels').select('id', { count: 'exact', head: true }),
      admin
        .from('download_options')
        .select('content_id')
        .eq('content_type', 'movie')
        .eq('authorization_status', 'approved')
        .eq('is_active', true),
      admin.from('app_settings').select('*').eq('key', 'platform_mode').maybeSingle(),
    ]);

    const downloadableSet = new Set(
      ((downloadsRes.data as any[]) || []).map((d) => d.content_id)
    );

    const rawMovies = (moviesRes.data as any[]) || [];
    items = rawMovies.map((m) => {
      const isLive = (m.content_rating || '').toUpperCase().includes('LIVE');
      return {
        id: m.id,
        title: m.title,
        slug: m.slug,
        synopsis: m.synopsis,
        poster_url: m.poster_url,
        backdrop_url: m.backdrop_url,
        trailer_url: m.trailer_url,
        release_year: m.release_year,
        language: m.language,
        content_rating: m.content_rating,
        is_published: m.is_published,
        status: m.status,
        primary_source: m.movie_sources?.[0]?.external_id || m.trailer_url || '',
        allow_download: !isLive && downloadableSet.has(m.id),
      };
    });

    const liveCount = items.filter((i) =>
      (i.content_rating || '').toUpperCase().includes('LIVE')
    ).length;

    counts = {
      movies: items.length - liveCount,
      liveChannels: liveCount,
      series: seriesRes.count ?? 0,
      reels: reelsRes.count ?? 0,
      downloads: downloadableSet.size,
    };

    if (settingsRes.data?.value) {
      platformMode = String(settingsRes.data.value);
    }
  } catch {
    // Fallback
  }

  const quickLinks = [
    { href: '/admin/series', label: 'Series & Seasons', icon: Tv },
    { href: '/admin/episodes', label: 'Episodes', icon: Layers },
    { href: '/admin/reels', label: 'Short Reels', icon: Clapperboard },
    { href: '/admin/recaps', label: 'Story Recaps', icon: Newspaper },
    { href: '/admin/categories', label: 'Categories', icon: Tags },
    { href: '/admin/downloads', label: 'Downloads', icon: Download },
    { href: '/admin/reports', label: 'Reports', icon: Flag },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div className="space-y-1">
          <SilaFlixLogo size="md" showTagline={true} />
          <p className="text-xs sm:text-sm text-ink-dim pt-1">
            Publish and manage movies, live TV channels, series, download permissions, and platform availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 bg-bg-card border border-line text-ink font-medium rounded-xl px-3.5 py-2.5 text-xs hover:border-[#e50914]/60 transition-colors"
          >
            <ExternalLink size={14} className="text-[#e50914]" />
            Watch Live TV
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-bg-card border border-line text-ink font-medium rounded-xl px-3.5 py-2.5 text-xs hover:border-gold/50 transition-colors"
          >
            <ExternalLink size={14} className="text-gold" />
            Open Website
          </Link>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-bg-card border border-line rounded-xl p-4">
          <p className="text-xs text-ink-faint font-medium">Full Movies</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-display text-2xl font-bold text-white">{counts.movies}</span>
            <span className="text-xs text-gold font-semibold">Published</span>
          </div>
        </div>
        <div className="bg-bg-card border border-line rounded-xl p-4">
          <p className="text-xs text-ink-faint font-medium">Live TV Channels</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-display text-2xl font-bold text-white">{counts.liveChannels}</span>
            <span className="text-xs text-[#e50914] font-semibold">24/7 Live</span>
          </div>
        </div>
        <div className="bg-bg-card border border-line rounded-xl p-4">
          <p className="text-xs text-ink-faint font-medium">Series & Reels</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-display text-2xl font-bold text-white">{counts.series}</span>
            <span className="text-xs text-ink-dim">{counts.reels} reels</span>
          </div>
        </div>
        <div className="bg-bg-card border border-line rounded-xl p-4">
          <p className="text-xs text-ink-faint font-medium">Downloadable Movies</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-display text-2xl font-bold text-white">{counts.downloads}</span>
            <span className="text-xs text-green-400">Enabled</span>
          </div>
        </div>
      </div>

      {/* Content & Status Manager */}
      <SimpleContentManager initialItems={items} initialPlatformMode={platformMode} />

      {/* Quick Navigation to Secondary Admin Tools */}
      <div className="pt-4 border-t border-line">
        <h3 className="text-sm font-semibold text-ink-dim mb-3">
          Additional Management Sections
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-card border border-line hover:border-gold/50 text-xs font-medium text-ink hover:text-gold transition-colors"
              >
                <Icon size={16} className="text-gold" />
                <span>{q.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
