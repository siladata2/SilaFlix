'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Tv } from 'lucide-react';
import { ImageInput } from '@/components/admin/ImageInput';

export function SeriesForm({ series }: { series?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(series?.title || '');
  const [slug, setSlug] = useState(series?.slug || '');
  const [synopsis, setSynopsis] = useState(series?.synopsis || '');
  const [posterUrl, setPosterUrl] = useState(series?.poster_url || '');
  const [backdropUrl, setBackdropUrl] = useState(series?.backdrop_url || '');
  const [language, setLanguage] = useState(series?.language || 'English');
  const [contentRating, setContentRating] = useState(series?.content_rating || 'TV-MA');
  const [isFeatured, setIsFeatured] = useState(series?.is_featured || false);
  const [isPublished, setIsPublished] = useState(series?.is_published ?? true);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!series && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      synopsis: synopsis.trim() || null,
      poster_url: posterUrl.trim() || null,
      backdrop_url: backdropUrl.trim() || null,
      language: language.trim() || null,
      content_rating: contentRating.trim() || null,
      is_featured: isFeatured,
      is_published: isPublished,
      status: isPublished ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    };

    try {
      if (series?.id) {
        const { error: err } = await supabase.from('series').update(payload).eq('id', series.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('series').insert(payload);
        if (err) throw err;
      }

      router.push('/admin/series');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save series');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-bg-card border border-line rounded-xl p-6">
      <div className="flex items-center gap-3 pb-3 border-b border-line">
        <div className="p-2 rounded-lg bg-gold/10 text-gold">
          <Tv size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-ink text-base">{series?.id ? 'Edit Series' : 'Create New Series'}</h2>
          <p className="text-xs text-ink-faint">Add TV shows and multiple seasons/episodes.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Series Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Slug *</label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-dim mb-1 font-medium">Synopsis</label>
        <textarea
          rows={3}
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      {/* Poster & Backdrop with Upload and URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-bg/50 border border-line">
        <ImageInput
          label="Poster Image"
          aspectHint="2:3 portrait"
          value={posterUrl}
          onChange={setPosterUrl}
          folder="series-posters"
        />
        <ImageInput
          label="Backdrop Image"
          aspectHint="16:9 banner"
          value={backdropUrl}
          onChange={setBackdropUrl}
          folder="series-backdrops"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Language</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Content Rating</label>
          <input
            type="text"
            value={contentRating}
            onChange={(e) => setContentRating(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="rounded border-line text-gold focus:ring-gold"
          />
          Featured Series
        </label>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-line text-gold focus:ring-gold"
          />
          Published
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-ink-dim hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-[#171412] font-semibold rounded-lg text-sm hover:bg-[#f0b25a] disabled:opacity-50 transition-colors"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {series?.id ? 'Update Series' : 'Create Series'}
        </button>
      </div>
    </form>
  );
}
