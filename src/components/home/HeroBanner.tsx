'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Info, Plus, Check } from 'lucide-react';
import type { Movie, Series } from '@/lib/types/database';

interface HeroBannerProps {
  item: Movie | Series;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ item }) => {
  const [inWatchlist, setInWatchlist] = useState(false);

  const isMovie = 'runtime_minutes' in item;
  const runtimeDisplay = isMovie && (item as Movie).runtime_minutes
    ? `${Math.floor(((item as Movie).runtime_minutes || 0) / 60)}h ${((item as Movie).runtime_minutes || 0) % 60}m`
    : 'Featured';

  const href = isMovie ? `/movies/${item.slug}` : `/series/${item.slug}`;

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[750px] overflow-hidden bg-black select-none">
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        {item.backdrop_url || item.poster_url ? (
          <img
            src={item.backdrop_url || item.poster_url || ''}
            alt={item.title}
            className="w-full h-full object-cover object-center filter brightness-[0.75] transform scale-105 transition duration-1000 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#161824] to-[#0d0f17]" />
        )}
        {/* Multi-Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f17] via-[#0d0f17]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f17] via-[#0d0f17]/70 to-transparent" />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative wrap h-full flex flex-col justify-end pb-16 sm:pb-20 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badge & Metadata */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
            <span className="bg-gold text-[#171412] px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[11px] font-bold shadow-md">
              Featured Premier
            </span>
            {item.release_year && (
              <span className="border border-white/20 bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded">
                {item.release_year}
              </span>
            )}
            {item.content_rating && (
              <span className="border border-white/20 bg-black/40 backdrop-blur-sm text-amber-400 font-bold px-2 py-0.5 rounded">
                {item.content_rating}
              </span>
            )}
            <span className="text-slate-300 font-medium">{runtimeDisplay}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-white tracking-tight leading-tight drop-shadow-lg">
            {item.title}
          </h1>

          {/* Synopsis */}
          {item.synopsis && (
            <p className="text-sm sm:text-base text-slate-200 line-clamp-3 leading-relaxed drop-shadow">
              {item.synopsis}
            </p>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href={href}
              className="flex items-center justify-center gap-2 bg-gold hover:bg-[#f0b25a] text-[#171412] font-bold px-6 py-3 rounded-xl shadow-lg transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={href}
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-5 py-3 rounded-xl backdrop-blur-md border border-white/20 transition-all"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </Link>

            <button
              onClick={() => setInWatchlist((prev) => !prev)}
              className={`p-3 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                inWatchlist
                  ? 'bg-gold/20 border-gold text-gold'
                  : 'bg-black/40 border-white/20 text-slate-200 hover:text-white hover:bg-white/10'
              }`}
              title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
            >
              {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
