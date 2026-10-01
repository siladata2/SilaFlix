'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit3,
  Trash2,
  Film,
  Radio,
  Wrench,
  PowerOff,
  CheckCircle2,
  Lock,
  Unlock,
  Search,
  Loader2,
  X,
  Save,
  ExternalLink,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { isDownloadableSource } from '@/lib/videoUtils';

export interface AdminMovieItem {
  id: string;
  title: string;
  slug: string;
  synopsis?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  trailer_url?: string | null;
  release_year?: number | null;
  language?: string | null;
  content_rating?: string | null;
  is_published?: boolean;
  status?: string;
  primary_source?: string;
  allow_download?: boolean;
}

interface SimpleContentManagerProps {
  initialItems: AdminMovieItem[];
  initialPlatformMode?: string;
}

export function SimpleContentManager({
  initialItems,
  initialPlatformMode = 'online',
}: SimpleContentManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<AdminMovieItem[]>(initialItems);
  const [platformMode, setPlatformMode] = useState<string>(initialPlatformMode);
  const [platformLoading, setPlatformLoading] = useState(false);

  // Filter & Search
  const [tabFilter, setTabFilter] = useState<'all' | 'movie' | 'live' | 'maintenance' | 'paid' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Startup Splash Wallpaper Quick Settings
  const [splashUrl, setSplashUrl] = useState('https://i.ibb.co/93Gb20Zq/Sila-Flix.jpg');
  const [splashDuration, setSplashDuration] = useState('3');
  const [savingSplash, setSavingSplash] = useState(false);

  React.useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.splash_wallpaper_url) setSplashUrl(d.splash_wallpaper_url);
        if (d?.splash_duration_seconds) setSplashDuration(String(d.splash_duration_seconds));
      })
      .catch(() => {});
  }, []);

  async function handleSaveSplash(e: React.FormEvent) {
    e.preventDefault();
    setSavingSplash(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          splash_wallpaper_url: splashUrl.trim() || 'https://i.ibb.co/93Gb20Zq/Sila-Flix.jpg',
          splash_duration_seconds: splashDuration,
        }),
      });
      if (res.ok) {
        showMessage('Startup fullscreen wallpaper updated!');
        router.refresh();
      } else {
        showMessage('Could not update wallpaper.');
      }
    } catch {
      showMessage('Connection interrupted.');
    } finally {
      setSavingSplash(false);
    }
  }

  // Add / Edit Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'movie' | 'live' | 'series' | 'reel'>('movie');
  const [streamUrl, setStreamUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [language, setLanguage] = useState('English');
  const [itemState, setItemState] = useState<'online' | 'maintenance' | 'offline'>('online');
  const [isPaid, setIsPaid] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showMessage(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  }

  function openNewForm(defaultKind: 'movie' | 'live' = 'movie') {
    setEditingId(null);
    setTitle('');
    setKind(defaultKind);
    setStreamUrl('');
    setPosterUrl('');
    setSynopsis('');
    setLanguage('English');
    setItemState('online');
    setIsPaid(false);
    setAllowDownload(defaultKind === 'movie');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEditForm(item: AdminMovieItem) {
    const rating = (item.content_rating || '').toUpperCase();
    const isLive = rating.includes('LIVE');
    const isMaint = rating.includes('MAINTENANCE');
    const isVip = rating.includes('VIP');
    const isOff = item.is_published === false || item.status === 'draft';

    setEditingId(item.id);
    setTitle(item.title);
    setKind(isLive ? 'live' : 'movie');
    setStreamUrl(item.primary_source || item.trailer_url || '');
    setPosterUrl(item.poster_url || '');
    setSynopsis(item.synopsis || '');
    setLanguage(item.language || 'English');
    setItemState(isOff ? 'offline' : isMaint ? 'maintenance' : 'online');
    setIsPaid(isVip);
    setAllowDownload(isLive ? false : Boolean(item.allow_download));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const effectiveAllowDownload = kind === 'live' ? false : allowDownload;
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch('/api/admin/content', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId || undefined,
          title,
          kind,
          streamUrl,
          posterUrl,
          backdropUrl: posterUrl,
          synopsis,
          language,
          state: itemState,
          isPaid,
          allowDownload: effectiveAllowDownload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMessage(`Error: ${data.error || 'Could not save changes'}`);
        return;
      }

      if (editingId && data.item) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingId
              ? {
                  ...it,
                  ...data.item,
                  primary_source: streamUrl,
                  allow_download:
                    data.item.allow_download !== undefined
                      ? data.item.allow_download
                      : effectiveAllowDownload,
                }
              : it
          )
        );
        showMessage(`"${title}" has been updated.`);
      } else if (data.item) {
        setItems((prev) => [
          {
            ...data.item,
            primary_source: streamUrl,
            allow_download: Boolean(data.item.allow_download),
          },
          ...prev,
        ]);
        showMessage(`"${title}" has been published.`);
      }

      setShowForm(false);
      setEditingId(null);
      router.refresh();
    } catch {
      showMessage('Connection interrupted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickUpdate(
    item: AdminMovieItem,
    changes: {
      state?: 'online' | 'maintenance' | 'offline';
      isPaid?: boolean;
      allowDownload?: boolean;
    }
  ) {
    setBusyId(item.id);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          ...changes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, ...data.item } : it))
        );
        showMessage(`Updated "${item.title}".`);
        router.refresh();
      }
    } catch {
      showMessage('Could not update item. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: AdminMovieItem) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/content?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        showMessage(`Deleted "${item.title}".`);
        router.refresh();
      }
    } catch {
      showMessage('Could not delete item. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePlatformModeChange(mode: 'online' | 'maintenance' | 'offline' | 'paid_vip') {
    setPlatformLoading(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'platform_mode',
          mode,
          applyToAll: true,
        }),
      });
      if (res.ok) {
        setPlatformMode(mode);
        setItems((prev) =>
          prev.map((it) => {
            const isLive = (it.content_rating || '').toUpperCase().includes('LIVE');
            const base = isLive ? 'LIVE' : 'PG-13';
            if (mode === 'maintenance') {
              return { ...it, is_published: true, content_rating: `${base} · MAINTENANCE` };
            }
            if (mode === 'offline') {
              return { ...it, is_published: false, status: 'draft' };
            }
            if (mode === 'paid_vip') {
              return { ...it, is_published: true, content_rating: `${base} · VIP` };
            }
            return { ...it, is_published: true, status: 'published', content_rating: base };
          })
        );
        showMessage(`Platform status updated to: ${mode.toUpperCase()}`);
        router.refresh();
      }
    } catch {
      showMessage('Could not update platform mode. Please try again.');
    } finally {
      setPlatformLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const rating = (it.content_rating || '').toUpperCase();
      const isLive = rating.includes('LIVE');
      const isMaint = rating.includes('MAINTENANCE');
      const isVip = rating.includes('VIP');
      const isOff = it.is_published === false || it.status === 'draft';

      if (tabFilter === 'movie' && isLive) return false;
      if (tabFilter === 'live' && !isLive) return false;
      if (tabFilter === 'maintenance' && !isMaint) return false;
      if (tabFilter === 'paid' && !isVip) return false;
      if (tabFilter === 'offline' && !isOff) return false;

      if (
        searchQuery.trim() &&
        !it.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [items, tabFilter, searchQuery]);

  const canStreamBeDownloaded = kind !== 'live' && (!streamUrl.trim() || isDownloadableSource(streamUrl));

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="bg-green-500/15 border border-green-500/40 text-green-300 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-green-300 hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {/* 1. GLOBAL PLATFORM MODE CONTROL BAR */}
      <div className="bg-bg-card border border-line rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-base sm:text-lg text-white">
            Global Platform Availability
          </h2>
          <p className="text-xs text-ink-dim mt-0.5">
            Switch the entire catalog between Online, Scheduled Maintenance, VIP Access, or Offline mode:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={platformLoading}
            onClick={() => handlePlatformModeChange('online')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              platformMode === 'online'
                ? 'bg-green-500 text-[#09140b] shadow-sm'
                : 'bg-bg border border-line text-ink-dim hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} /> Online
          </button>

          <button
            type="button"
            disabled={platformLoading}
            onClick={() => handlePlatformModeChange('maintenance')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              platformMode === 'maintenance'
                ? 'bg-amber-500 text-[#171206] shadow-sm'
                : 'bg-bg border border-line text-ink-dim hover:text-white'
            }`}
          >
            <Wrench size={14} /> Maintenance
          </button>

          <button
            type="button"
            disabled={platformLoading}
            onClick={() => handlePlatformModeChange('paid_vip')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              platformMode === 'paid_vip'
                ? 'bg-gold text-[#171412] shadow-sm'
                : 'bg-bg border border-line text-ink-dim hover:text-white'
            }`}
          >
            <Lock size={14} /> All VIP
          </button>

          <button
            type="button"
            disabled={platformLoading}
            onClick={() => handlePlatformModeChange('offline')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              platformMode === 'offline'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-bg border border-line text-ink-dim hover:text-white'
            }`}
          >
            <PowerOff size={14} /> Offline
          </button>
        </div>
      </div>

      {/* 1B. STARTUP FULLSCREEN WALLPAPER (SPLASH SCREEN) CONTROL */}
      <form
        onSubmit={handleSaveSplash}
        className="bg-bg-card border border-line rounded-2xl p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-white">
              App Startup Fullscreen Wallpaper (2–4 Seconds)
            </h2>
            <Link
              href="/admin/reels"
              className="text-xs font-semibold text-gold hover:underline"
            >
              Manage Reels →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[11px] text-ink-faint mb-1">
                Wallpaper Image URL
              </label>
              <input
                type="url"
                value={splashUrl}
                onChange={(e) => setSplashUrl(e.target.value)}
                placeholder="https://i.ibb.co/93Gb20Zq/Sila-Flix.jpg"
                className="w-full bg-bg border border-line rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ink-faint mb-1">
                Duration
              </label>
              <select
                value={splashDuration}
                onChange={(e) => setSplashDuration(e.target.value)}
                className="w-full bg-bg border border-line rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
              >
                <option value="2">2 Seconds</option>
                <option value="3">3 Seconds</option>
                <option value="4">4 Seconds</option>
              </select>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={savingSplash}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold hover:bg-[#f0b25a] text-[#171412] text-xs font-bold transition-colors shrink-0"
        >
          {savingSplash ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Wallpaper
        </button>
      </form>

      {/* 2. QUICK ACTION HEADER + ADD/EDIT STUDIO FORM */}
      <div className="bg-bg-card border border-line rounded-2xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Publish & Manage Movies, Live TV & Series
            </h2>
            <p className="text-xs text-ink-dim">
              Add new movies or live television channels, manage download permissions, or update availability below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openNewForm('movie')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e50914] hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus size={15} /> Add New Movie
            </button>
            <button
              type="button"
              onClick={() => openNewForm('live')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold hover:bg-[#f0b25a] text-[#171412] text-xs font-bold transition-colors shadow-sm"
            >
              <Radio size={15} /> Add Live Channel
            </button>
          </div>
        </div>

        {/* Collapsible Add/Edit Form */}
        {showForm && (
          <form
            onSubmit={handleSaveForm}
            className="pt-5 border-t border-line space-y-4 bg-bg/50 p-4 sm:p-5 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gold">
                {editingId ? 'Edit Content' : 'Add New Content'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-xs text-ink-dim hover:text-white flex items-center gap-1"
              >
                <X size={15} /> Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-ink-dim mb-1 font-medium">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter movie or channel title..."
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-ink-dim mb-1 font-medium">
                  Content Type
                </label>
                <select
                  value={kind}
                  onChange={(e) => {
                    const nextKind = e.target.value as 'movie' | 'live' | 'series' | 'reel';
                    setKind(nextKind);
                    if (nextKind === 'live') {
                      setAllowDownload(false);
                    }
                  }}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                >
                  <option value="movie">Movie</option>
                  <option value="live">Live TV Channel</option>
                  <option value="series">TV Series</option>
                  <option value="reel">Short Reel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-ink-dim mb-1 font-medium">
                  Stream or Video Link (Google Drive, MP4, HLS .m3u8, YouTube) *
                </label>
                <input
                  type="text"
                  required
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-ink-dim mb-1 font-medium">
                  Poster / Cover Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-dim mb-1 font-medium">
                Synopsis / Description
              </label>
              <textarea
                rows={2}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Write a brief description..."
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs text-ink-dim mb-1 font-medium">
                  Availability Status
                </label>
                <select
                  value={itemState}
                  onChange={(e) => setItemState(e.target.value as any)}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-gold"
                >
                  <option value="online">Online (Published)</option>
                  <option value="maintenance">Scheduled Maintenance</option>
                  <option value="offline">Offline (Hidden)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-ink-dim mb-1 font-medium">
                  Access Tier
                </label>
                <select
                  value={isPaid ? 'paid' : 'free'}
                  onChange={(e) => setIsPaid(e.target.value === 'paid')}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-gold"
                >
                  <option value="free">Free to Watch</option>
                  <option value="paid">VIP / Paid Access</option>
                </select>
              </div>

              {/* Download Option: Strictly hidden for Live TV, controllable for Movies */}
              {kind !== 'live' && (
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDownload && canStreamBeDownloaded}
                      disabled={!canStreamBeDownloaded}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                      className="rounded border-line text-gold focus:ring-gold"
                    />
                    <span>Allow Viewers to Download</span>
                  </label>
                  <span className="text-[11px] text-ink-faint mt-0.5">
                    {canStreamBeDownloaded
                      ? 'Available for Google Drive and MP4 movie links'
                      : 'Only Google Drive or MP4 files can be downloaded'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 text-xs text-ink-dim hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-[#171412] font-bold text-xs hover:bg-[#f0b25a] disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editingId ? 'Save Changes' : 'Publish Now'}
              </button>
            </div>
          </form>
        )}

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-line">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {[
              { id: 'all', label: `All (${items.length})` },
              { id: 'movie', label: 'Movies' },
              { id: 'live', label: 'Live TV' },
              { id: 'paid', label: 'VIP' },
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'offline', label: 'Offline' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTabFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  tabFilter === t.id
                    ? 'bg-gold text-[#171412] font-bold'
                    : 'bg-bg border border-line text-ink-dim hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies or channels..."
              className="w-full bg-bg border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Items List with 1-Click Controls */}
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const rating = (item.content_rating || '').toUpperCase();
            const isLive = rating.includes('LIVE');
            const isMaint = rating.includes('MAINTENANCE');
            const isVip = rating.includes('VIP');
            const isOff = item.is_published === false || item.status === 'draft';
            const currentState = isOff ? 'offline' : isMaint ? 'maintenance' : 'online';
            const isBusy = busyId === item.id;
            const dlAllowed = !isLive && Boolean(item.allow_download);

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-bg/70 border border-line hover:border-gold/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Item Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-bg-raised border border-line flex-none flex items-center justify-center">
                    {item.poster_url ? (
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : isLive ? (
                      <Radio size={20} className="text-[#e50914]" />
                    ) : (
                      <Film size={20} className="text-gold" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-ink-faint">
                      <span className={isLive ? 'text-[#e50914] font-bold' : 'text-gold font-bold'}>
                        {isLive ? 'LIVE TV' : 'MOVIE'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.language || 'English'}</span>
                      {isVip && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-gold font-bold">VIP</span>
                        </>
                      )}
                      {!isLive && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className={dlAllowed ? 'text-green-400 font-medium' : 'text-ink-faint'}>
                            {dlAllowed ? 'Download Enabled' : 'Stream Only'}
                          </span>
                        </>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                    {item.synopsis && (
                      <p className="text-xs text-ink-dim truncate max-w-md mt-0.5">
                        {item.synopsis}
                      </p>
                    )}
                  </div>
                </div>

                {/* 1-Click Action Controls */}
                <div className="flex flex-wrap items-center gap-2 flex-none">
                  {/* Status Selector: Online | Maintenance | Offline */}
                  <div className="inline-flex items-center bg-bg-card border border-line rounded-lg p-0.5 text-[11px]">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleQuickUpdate(item, { state: 'online' })}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        currentState === 'online'
                          ? 'bg-green-500 text-[#08130a]'
                          : 'text-ink-dim hover:text-white'
                      }`}
                    >
                      Online
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleQuickUpdate(item, { state: 'maintenance' })}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        currentState === 'maintenance'
                          ? 'bg-amber-500 text-[#181105]'
                          : 'text-ink-dim hover:text-white'
                      }`}
                    >
                      Maintenance
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleQuickUpdate(item, { state: 'offline' })}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        currentState === 'offline'
                          ? 'bg-red-500 text-white'
                          : 'text-ink-dim hover:text-white'
                      }`}
                    >
                      Offline
                    </button>
                  </div>

                  {/* Allow / Disallow Download Toggle (ONLY for Movies, never for Live TV) */}
                  {!isLive && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleQuickUpdate(item, { allowDownload: !dlAllowed })}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        dlAllowed
                          ? 'bg-green-500/15 border-green-500/40 text-green-300'
                          : 'bg-bg-card border-line text-ink-dim hover:text-white'
                      }`}
                      title="Toggle whether viewers can download this movie"
                    >
                      <Download size={12} />
                      {dlAllowed ? 'Download: On' : 'Download: Off'}
                    </button>
                  )}

                  {/* Paid / Free Toggle */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleQuickUpdate(item, { isPaid: !isVip })}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isVip
                        ? 'bg-gold/20 border-gold text-gold'
                        : 'bg-bg-card border-line text-ink-dim hover:text-white'
                    }`}
                    title="Toggle between Free and VIP Access"
                  >
                    {isVip ? <Lock size={12} /> : <Unlock size={12} />}
                    {isVip ? 'VIP' : 'Free'}
                  </button>

                  {/* View Page */}
                  <Link
                    href={isLive ? `/live/${item.slug}` : `/movies/${item.slug}`}
                    className="p-2 rounded-lg bg-bg-card border border-line text-ink-dim hover:text-white transition-colors"
                    title="View Page"
                  >
                    <ExternalLink size={14} />
                  </Link>

                  {/* Edit Button */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openEditForm(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-card border border-line text-xs font-semibold text-gold hover:border-gold transition-colors"
                  >
                    <Edit3 size={13} /> Edit
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDelete(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
