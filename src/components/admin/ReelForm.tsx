'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Clapperboard } from 'lucide-react';
import { ImageInput } from '@/components/admin/ImageInput';
import { VideoSourceInput } from '@/components/admin/VideoSourceInput';
import { BackButton } from '@/components/ui/BackButton';

export function ReelForm({ reel }: { reel?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(reel?.title || '');
  const [description, setDescription] = useState(reel?.description || reel?.caption || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(reel?.thumbnail_url || '');
  const [videoUrl, setVideoUrl] = useState(reel?.video_url || '');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [isPublished, setIsPublished] = useState(reel?.is_published ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoUrl.trim()) {
      setError('Video source (upload or URL) is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reel?.id,
          title: title.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl.trim() || null,
          video_url: videoUrl.trim(),
          download_url: downloadUrl.trim() || null,
          download_enabled: downloadEnabled,
          is_published: isPublished,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save reel');
      }

      router.push('/admin/reels');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save reel');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <BackButton fallbackHref="/admin/reels" label="Back to Reels" />

      <form onSubmit={handleSubmit} className="space-y-6 bg-bg-card border border-line rounded-xl p-6">
        <div className="flex items-center gap-3 pb-3 border-b border-line">
          <div className="p-2 rounded-lg bg-gold/10 text-gold">
            <Clapperboard size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-ink text-base">
              {reel?.id ? 'Edit Reel' : 'Add New Reel'}
            </h2>
            <p className="text-xs text-ink-faint">
              Full-screen TikTok-style vertical reels with MP4, Google Drive & YouTube support.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Reel Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Afrobeats Dance Trend | Viral Short"
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Description / Caption</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="#afrobeats #music #dance..."
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <ImageInput
          label="Cover / Thumbnail (9:16 vertical recommended)"
          aspectHint="9:16 portrait"
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
          folder="reels"
        />

        <VideoSourceInput
          label="Reel Video (Upload File, YouTube URL, Google Drive or Direct MP4 Link)"
          videoUrl={videoUrl}
          onChangeVideoUrl={setVideoUrl}
          downloadUrl={downloadUrl}
          onChangeDownloadUrl={setDownloadUrl}
          downloadEnabled={downloadEnabled}
          onChangeDownloadEnabled={setDownloadEnabled}
          showQualities={false}
          showSubtitles={false}
          folder="reels"
        />

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-line text-gold focus:ring-gold"
            />
            Publish immediately
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
            {reel?.id ? 'Update Reel' : 'Publish Reel'}
          </button>
        </div>
      </form>
    </div>
  );
}
