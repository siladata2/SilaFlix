'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Play,
  Search,
  Tv,
  Lock,
  Wrench,
} from 'lucide-react';
import type { CatalogEntry } from '@/lib/streamCatalog';

interface LiveTvClientProps {
  channels: (CatalogEntry & { status?: string; isPaid?: boolean })[];
}

const CHANNEL_GROUPS = [
  { id: 'all', label: 'All Channels' },
  { id: 'tanzania', label: 'East Africa' },
  { id: 'music', label: 'Music & Afrobeats' },
  { id: 'action', label: 'Movies & Action' },
  { id: 'kids', label: 'Kids & Family' },
  { id: 'sports', label: 'Sports' },
  { id: 'global', label: 'International' },
];

export function getChannelGroup(channel: CatalogEntry): string {
  const s = (channel.title + ' ' + channel.synopsis).toLowerCase();
  if (s.includes('tanzania') || s.includes('east africa') || s.includes('swahili')) return 'tanzania';
  if (s.includes('afrobeats') || s.includes('music') || s.includes('mixtv')) return 'music';
  if (s.includes('disney') || s.includes('cartoon') || s.includes('kids') || s.includes('family')) return 'kids';
  if (s.includes('sport') || s.includes('arena')) return 'sports';
  if (s.includes('sony') || s.includes('cinerama') || s.includes('cinema') || s.includes('action'))
    return 'action';
  return 'global';
}

export function LiveTvClient({ channels }: LiveTvClientProps) {
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      const matchesGroup = groupFilter === 'all' || getChannelGroup(ch) === groupFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.synopsis.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [channels, groupFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search + Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-card border border-line rounded-xl p-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {CHANNEL_GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGroupFilter(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                groupFilter === g.id
                  ? 'bg-[#e50914] text-white font-semibold'
                  : 'bg-bg border border-line text-ink-dim hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 flex-none">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search live channels..."
            className="w-full bg-bg border border-line rounded-lg pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-gold/60"
          />
        </div>
      </div>

      {/* Channels Grid */}
      {filteredChannels.length === 0 ? (
        <div className="bg-bg-card border border-line rounded-xl p-12 text-center text-ink-dim text-sm">
          <Tv size={32} className="mx-auto mb-2 text-ink-faint" />
          No live channels match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredChannels.map((ch) => {
            const isMaintenance = ch.status === 'maintenance';
            const isPaid = ch.isPaid || ch.status === 'paid' || ch.content_rating?.includes('VIP');

            return (
              <Link
                key={ch.slug}
                href={`/live/${ch.slug}`}
                className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-[#e50914]/60 transition-all shadow-sm"
              >
                <div className="aspect-video relative bg-bg-raised overflow-hidden">
                  <img
                    src={ch.backdrop_url || ch.poster_url}
                    alt={ch.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-semibold text-white">
                    {isMaintenance ? (
                      <>
                        <Wrench size={11} className="text-amber-400" />
                        <span className="text-amber-300">MAINTENANCE</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span>LIVE · CH {ch.channel_number || 100}</span>
                      </>
                    )}
                  </div>

                  {isPaid && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-gold text-[#171412] px-2 py-0.5 rounded text-[10px] font-bold">
                      <Lock size={10} /> VIP
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-11 h-11 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg">
                      <Play size={18} className="fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-sm text-white truncate group-hover:text-[#e50914] transition-colors">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-ink-dim line-clamp-2 mt-1 leading-relaxed">
                    {ch.synopsis}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-faint mt-2.5 pt-2.5 border-t border-line/60">
                    <span className="text-[#e50914] font-semibold">Watch Live</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{ch.language}</span>
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
