'use client';

import React, { useState } from 'react';
import { InlineSecurePlayer } from './InlineSecurePlayer';
import { Play, Download, Tv } from 'lucide-react';

export interface SeriesEpisodeView {
  id: string;
  season_number: number;
  episode_number: number;
  title: string;
  synopsis: string | null;
  runtime_minutes: number | null;
  thumbnail_url: string | null;
  streamToken: string;
  downloadToken?: string;
  allowDownload?: boolean;
  quality?: string;
}

interface SeriesWatchClientProps {
  seriesTitle: string;
  posterUrl?: string | null;
  fallbackToken?: string;
  episodes: SeriesEpisodeView[];
  status?: string;
}

export function SeriesWatchClient({
  seriesTitle,
  posterUrl,
  fallbackToken = '',
  episodes,
  status = 'published',
}: SeriesWatchClientProps) {
  const seasons = Array.from(new Set(episodes.map((e) => e.season_number))).sort((a, b) => a - b);
  const [selectedSeason, setSelectedSeason] = useState<number>(seasons[0] || 1);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>(episodes[0]?.id || '');

  const activeEpisode =
    episodes.find((e) => e.id === activeEpisodeId) || episodes[0] || null;

  const seasonEpisodes = episodes.filter((e) => e.season_number === selectedSeason);

  const playerTitle = activeEpisode
    ? `${seriesTitle} — S${activeEpisode.season_number}:E${activeEpisode.episode_number} "${activeEpisode.title}"`
    : seriesTitle;

  const activeToken = activeEpisode?.streamToken || fallbackToken;
  const activeDownloadToken = activeEpisode?.downloadToken || '';
  const activeAllowDownload = Boolean(activeEpisode?.allowDownload);
  const activeQuality = activeEpisode?.quality || '1080p';

  return (
    <div className="space-y-8">
      {/* Main Video Player */}
      {activeToken ? (
        <InlineSecurePlayer
          title={playerTitle}
          poster={activeEpisode?.thumbnail_url || posterUrl || undefined}
          primaryTokenOrUrl={activeToken}
          downloadToken={activeDownloadToken}
          allowDownload={activeAllowDownload}
          isLive={false}
          status={status}
        />
      ) : (
        <div className="aspect-video w-full rounded-2xl bg-bg-card border border-line flex flex-col items-center justify-center p-8 text-center">
          <Tv size={36} className="text-gold mb-3" />
          <p className="text-base font-semibold text-white">No Episodes Uploaded Yet</p>
          <p className="text-xs text-ink-faint mt-1">
            Episodes for {seriesTitle} will appear here as soon as they are published.
          </p>
        </div>
      )}

      {/* Single Bottom Download Section for Active Episode (Quality Number Only) */}
      {activeEpisode && activeAllowDownload && activeDownloadToken && (
        <div className="bg-bg-card border border-line rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold text-xs tracking-wide">
              {activeQuality}
            </span>
            <span className="text-xs sm:text-sm font-medium text-ink-dim">
              Episode {activeEpisode.episode_number}: {activeEpisode.title}
            </span>
          </div>
          <a
            href={`/api/downloads/direct?token=${encodeURIComponent(
              activeDownloadToken
            )}&title=${encodeURIComponent(
              `${seriesTitle}-S${activeEpisode.season_number}E${activeEpisode.episode_number}`
            )}`}
            download
            className="inline-flex items-center gap-2 bg-bg border border-line hover:border-ink-dim text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all"
          >
            <Download size={15} />
            <span>Download ({activeQuality})</span>
          </a>
        </div>
      )}

      {/* Season & Episode Selector */}
      {episodes.length > 0 && (
        <div className="bg-bg-card border border-line rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-display font-bold text-white">
                Seasons & Episodes ({episodes.length})
              </h2>
              <p className="text-xs text-ink-faint">
                Select any episode below to watch immediately.
              </p>
            </div>

            {seasons.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {seasons.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSeason(s)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSeason === s
                        ? 'bg-gold text-[#171412]'
                        : 'bg-bg border border-line text-ink-dim hover:text-white'
                    }`}
                  >
                    Season {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {seasonEpisodes.map((ep) => {
              const isCurrent = activeEpisode?.id === ep.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => setActiveEpisodeId(ep.id)}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-gold/10 border-gold/50'
                      : 'bg-bg border-line hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveEpisodeId(ep.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isCurrent
                          ? 'bg-[#e50914] text-white'
                          : 'bg-bg-card border border-line text-ink-dim hover:text-white'
                      }`}
                    >
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase text-gold">
                          S{ep.season_number} · EP {ep.episode_number}
                        </span>
                        {ep.runtime_minutes && (
                          <span className="text-[11px] text-ink-faint">
                            · {ep.runtime_minutes} min
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{ep.title}</p>
                      {ep.synopsis && (
                        <p className="text-xs text-ink-faint line-clamp-1 mt-0.5">{ep.synopsis}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
