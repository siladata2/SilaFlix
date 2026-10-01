'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Movie } from '@/lib/types/database';
import { ImageInput } from '@/components/admin/ImageInput';
import { VideoSourceInput, type VideoQualityOption, type SubtitleOption } from '@/components/admin/VideoSourceInput';

interface MovieFormProps {
  movie?: Movie;
}

export function MovieForm({ movie }: MovieFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(movie?.title || '');
  const [slug, setSlug] = useState(movie?.slug || '');
  const [synopsis, setSynopsis] = useState(movie?.synopsis || '');
  const [posterUrl, setPosterUrl] = useState(movie?.poster_url || '');
  const [backdropUrl, setBackdropUrl] = useState(movie?.backdrop_url || '');
  const [trailerUrl, setTrailerUrl] = useState(movie?.trailer_url || '');
  const [releaseYear, setReleaseYear] = useState<number | ''>(movie?.release_year || new Date().getFullYear());
  const [runtimeMinutes, setRuntimeMinutes] = useState<number | ''>(movie?.runtime_minutes || 120);
  const [contentRating, setContentRating] = useState(movie?.content_rating || 'PG-13');
  const [language, setLanguage] = useState(movie?.language || 'English');
  const [isFeatured, setIsFeatured] = useState(movie?.is_featured || false);
  const [isPublished, setIsPublished] = useState(movie?.is_published ?? true);

  // Advanced Video & Download sources
  const [videoUrl, setVideoUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [qualities, setQualities] = useState<VideoQualityOption[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleOption[]>([]);

  // Load existing movie sources & download options if editing
  useEffect(() => {
    if (!movie?.id) return;
    const supabase = createClient();

    async function loadSources() {
      // 1. Load movie sources
      const { data: sources } = await supabase
        .from('movie_sources')
        .select('*')
        .eq('movie_id', movie!.id)
        .eq('is_active', true);

      if (sources && sources.length > 0) {
        setVideoUrl(sources[0].external_id);
        const mappedQualities: VideoQualityOption[] = sources.map((s) => ({
          quality: (s.quality as any) || '1080p',
          url: s.external_id,
        }));
        setQualities(mappedQualities);
      }

      // 2. Load download options
      const { data: downloads } = await supabase
        .from('download_options')
        .select('*')
        .eq('content_type', 'movie')
        .eq('content_id', movie!.id)
        .eq('is_active', true);

      if (downloads && downloads.length > 0) {
        setDownloadEnabled(true);
        setDownloadUrl(downloads[0].protected_file_reference || '');
      } else {
        setDownloadEnabled(false);
      }
    }

    loadSources();
  }, [movie]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!movie && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) {
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
    // Keep payload clean with existing columns in 'movies' table (no nonexistent columns like stream_url/video_url)
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      synopsis: synopsis.trim() || null,
      poster_url: posterUrl.trim() || null,
      backdrop_url: backdropUrl.trim() || null,
      trailer_url: trailerUrl.trim() || null,
      release_year: releaseYear ? Number(releaseYear) : null,
      runtime_minutes: runtimeMinutes ? Number(runtimeMinutes) : null,
      content_rating: contentRating.trim() || null,
      language: language.trim() || null,
      is_featured: isFeatured,
      is_published: isPublished,
      status: isPublished ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    };

    try {
      let movieId = movie?.id;

      if (movieId) {
        const { error: updateError } = await supabase
          .from('movies')
          .update(payload)
          .eq('id', movieId);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('movies')
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        movieId = inserted.id;
      }

      // Sync Movie Sources in 'movie_sources' table
      if (videoUrl.trim() && movieId) {
        // Clear old sources
        await supabase.from('movie_sources').delete().eq('movie_id', movieId);

        // Insert primary video source
        await supabase.from('movie_sources').insert({
          movie_id: movieId,
          provider: 'external',
          external_id: videoUrl.trim(),
          quality: '1080p',
          is_active: true,
        });

        // Insert additional qualities
        for (const q of qualities) {
          if (q.url !== videoUrl.trim()) {
            await supabase.from('movie_sources').insert({
              movie_id: movieId,
              provider: 'external',
              external_id: q.url.trim(),
              quality: q.quality,
              is_active: true,
            });
          }
        }
      }

      // Sync Download Options in 'download_options' table
      if (movieId) {
        await supabase
          .from('download_options')
          .delete()
          .eq('content_type', 'movie')
          .eq('content_id', movieId);

        if (downloadEnabled && (downloadUrl.trim() || videoUrl.trim())) {
          const effectiveDownload = downloadUrl.trim() || videoUrl.trim();
          await supabase.from('download_options').insert({
            content_type: 'movie',
            content_id: movieId,
            quality: '1080p',
            format: effectiveDownload.endsWith('.mp4') ? 'mp4' : 'video',
            file_size_bytes: 1024 * 1024 * 750, // default placeholder size
            protected_file_reference: effectiveDownload,
            authorization_status: 'approved',
            is_active: true,
          });
        }
      }

      router.push('/admin/movies');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save movie');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl bg-bg-card border border-line rounded-xl p-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Slug (URL identifier) *</label>
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

      {/* Poster & Backdrop with Upload or Image URL options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-bg/50 border border-line">
        <ImageInput
          label="Poster Image"
          aspectHint="2:3 portrait"
          value={posterUrl}
          onChange={setPosterUrl}
          folder="posters"
        />
        <ImageInput
          label="Backdrop Image"
          aspectHint="16:9 banner"
          value={backdropUrl}
          onChange={setBackdropUrl}
          folder="backdrops"
        />
      </div>

      {/* Video Streaming, Download links, Qualities, and Subtitles */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-ink">Video Sources & Playback</h3>
        <VideoSourceInput
          label="Primary Movie Video Source (File Upload or External URL)"
          videoUrl={videoUrl}
          onChangeVideoUrl={setVideoUrl}
          downloadUrl={downloadUrl}
          onChangeDownloadUrl={setDownloadUrl}
          downloadEnabled={downloadEnabled}
          onChangeDownloadEnabled={setDownloadEnabled}
          qualities={qualities}
          onChangeQualities={setQualities}
          subtitles={subtitles}
          onChangeSubtitles={setSubtitles}
          showQualities={true}
          showSubtitles={true}
          folder="movies"
        />
      </div>

      {/* Optional Trailer */}
      <div>
        <label className="block text-xs text-ink-dim mb-1 font-medium">Trailer URL (Optional)</label>
        <input
          type="url"
          value={trailerUrl}
          onChange={(e) => setTrailerUrl(e.target.value)}
          placeholder="https://... (YouTube, MP4, or trailer stream)"
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Release Year</label>
          <input
            type="number"
            value={releaseYear}
            onChange={(e) => setReleaseYear(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Runtime (min)</label>
          <input
            type="number"
            value={runtimeMinutes}
            onChange={(e) => setRuntimeMinutes(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Rating</label>
          <input
            type="text"
            value={contentRating}
            onChange={(e) => setContentRating(e.target.value)}
            placeholder="PG-13"
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Language</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="English / Swahili"
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
          Feature on Homepage Banner
        </label>

        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-line text-gold focus:ring-gold"
          />
          Published (Live to public)
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
          {movie?.id ? 'Update Movie' : 'Create Movie'}
        </button>
      </div>
    </form>
  );
}
