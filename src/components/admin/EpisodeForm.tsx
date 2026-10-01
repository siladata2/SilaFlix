'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Film } from 'lucide-react';
import { ImageInput } from '@/components/admin/ImageInput';
import { VideoSourceInput, type VideoQualityOption } from '@/components/admin/VideoSourceInput';

export function EpisodeForm({ episode }: { episode?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [seasonsList, setSeasonsList] = useState<any[]>([]);

  const [seriesId, setSeriesId] = useState(episode?.series_id || '');
  const [seasonId, setSeasonId] = useState(episode?.season_id || '');
  const [episodeNumber, setEpisodeNumber] = useState<number | ''>(episode?.episode_number || 1);
  const [title, setTitle] = useState(episode?.title || '');
  const [synopsis, setSynopsis] = useState(episode?.synopsis || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(episode?.thumbnail_url || '');
  const [runtimeMinutes, setRuntimeMinutes] = useState<number | ''>(episode?.runtime_minutes || 45);
  const [isPublished, setIsPublished] = useState(episode?.is_published ?? true);

  // Video & Download sources
  const [videoUrl, setVideoUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [qualities, setQualities] = useState<VideoQualityOption[]>([]);

  // Load series on mount
  useEffect(() => {
    const supabase = createClient();
    async function loadSeries() {
      const { data } = await supabase.from('series').select('id, title').order('title');
      if (data && data.length > 0) {
        setSeriesList(data);
        if (!seriesId) setSeriesId(data[0].id);
      }
    }
    loadSeries();
  }, []);

  // Load seasons when seriesId changes
  useEffect(() => {
    if (!seriesId) return;
    const supabase = createClient();
    async function loadSeasons() {
      let { data } = await supabase
        .from('seasons')
        .select('*')
        .eq('series_id', seriesId)
        .order('season_number');

      // Auto-create Season 1 if none exists for this series
      if (!data || data.length === 0) {
        const { data: newSeason } = await supabase
          .from('seasons')
          .insert({
            series_id: seriesId,
            season_number: 1,
            title: 'Season 1',
          })
          .select();
        data = newSeason;
      }

      if (data && data.length > 0) {
        setSeasonsList(data);
        if (!seasonId || !data.some((s) => s.id === seasonId)) {
          setSeasonId(data[0].id);
        }
      }
    }
    loadSeasons();
  }, [seriesId]);

  // Load existing episode sources
  useEffect(() => {
    if (!episode?.id) return;
    const supabase = createClient();
    async function loadSources() {
      const { data: sources } = await supabase
        .from('episode_sources')
        .select('*')
        .eq('episode_id', episode.id)
        .eq('is_active', true);

      if (sources && sources.length > 0) {
        setVideoUrl(sources[0].external_id);
        setQualities(
          sources.map((s) => ({
            quality: (s.quality as any) || '1080p',
            url: s.external_id,
          }))
        );
      }

      const { data: downloads } = await supabase
        .from('download_options')
        .select('*')
        .eq('content_type', 'episode')
        .eq('content_id', episode.id)
        .eq('is_active', true);

      if (downloads && downloads.length > 0) {
        setDownloadEnabled(true);
        setDownloadUrl(downloads[0].protected_file_reference || '');
      }
    }
    loadSources();
  }, [episode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!seriesId || !seasonId) {
      setError('Please select both a Series and a Season.');
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      series_id: seriesId,
      season_id: seasonId,
      episode_number: Number(episodeNumber),
      title: title.trim(),
      synopsis: synopsis.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      runtime_minutes: runtimeMinutes ? Number(runtimeMinutes) : null,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    try {
      let epId = episode?.id;
      if (epId) {
        const { error: err } = await supabase.from('episodes').update(payload).eq('id', epId);
        if (err) throw err;
      } else {
        const { data: inserted, error: err } = await supabase.from('episodes').insert(payload).select().single();
        if (err) throw err;
        epId = inserted.id;
      }

      // Sync episode_sources
      if (videoUrl.trim() && epId) {
        await supabase.from('episode_sources').delete().eq('episode_id', epId);
        await supabase.from('episode_sources').insert({
          episode_id: epId,
          provider: 'external',
          external_id: videoUrl.trim(),
          quality: '1080p',
          is_active: true,
        });

        for (const q of qualities) {
          if (q.url !== videoUrl.trim()) {
            await supabase.from('episode_sources').insert({
              episode_id: epId,
              provider: 'external',
              external_id: q.url.trim(),
              quality: q.quality,
              is_active: true,
            });
          }
        }
      }

      // Sync download option
      if (epId) {
        await supabase
          .from('download_options')
          .delete()
          .eq('content_type', 'episode')
          .eq('content_id', epId);

        if (downloadEnabled && (downloadUrl.trim() || videoUrl.trim())) {
          const effectiveDl = downloadUrl.trim() || videoUrl.trim();
          await supabase.from('download_options').insert({
            content_type: 'episode',
            content_id: epId,
            quality: '1080p',
            format: effectiveDl.endsWith('.mp4') ? 'mp4' : 'video',
            file_size_bytes: 1024 * 1024 * 350,
            protected_file_reference: effectiveDl,
            authorization_status: 'approved',
            is_active: true,
          });
        }
      }

      router.push('/admin/episodes');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save episode');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-bg-card border border-line rounded-xl p-6">
      <div className="flex items-center gap-3 pb-3 border-b border-line">
        <div className="p-2 rounded-lg bg-gold/10 text-gold">
          <Film size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-ink text-base">{episode?.id ? 'Edit Episode' : 'Add New Episode'}</h2>
          <p className="text-xs text-ink-faint">Add episode video files, Google Drive links, HLS streams, and download options.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Series & Season Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Series *</label>
          <select
            value={seriesId}
            onChange={(e) => setSeriesId(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          >
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Season *</label>
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          >
            {seasonsList.map((s) => (
              <option key={s.id} value={s.id}>
                Season {s.season_number} {s.title ? `(${s.title})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Episode Number *</label>
          <input
            type="number"
            min={1}
            required
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(Number(e.target.value))}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-dim mb-1 font-medium">Episode Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pilot / Episode 1"
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      <div>
        <label className="block text-xs text-ink-dim mb-1 font-medium">Synopsis</label>
        <textarea
          rows={2}
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      {/* Episode Thumbnail with Upload and URL */}
      <ImageInput
        label="Episode Thumbnail"
        aspectHint="16:9 landscape"
        value={thumbnailUrl}
        onChange={setThumbnailUrl}
        folder="episodes"
      />

      {/* Episode Video Source (File upload, Google Drive, M3U8, MP4, Qualities & Download Link) */}
      <VideoSourceInput
        label="Episode Video Source (File Upload or External Link)"
        videoUrl={videoUrl}
        onChangeVideoUrl={setVideoUrl}
        downloadUrl={downloadUrl}
        onChangeDownloadUrl={setDownloadUrl}
        downloadEnabled={downloadEnabled}
        onChangeDownloadEnabled={setDownloadEnabled}
        qualities={qualities}
        onChangeQualities={setQualities}
        showQualities={true}
        showSubtitles={false}
        folder="episodes"
      />

      <div className="flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-line text-gold focus:ring-gold"
          />
          Published immediately
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
          {episode?.id ? 'Update Episode' : 'Save Episode'}
        </button>
      </div>
    </form>
  );
}
