'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, BookOpen } from 'lucide-react';
import { ImageInput } from '@/components/admin/ImageInput';
import { VideoSourceInput } from '@/components/admin/VideoSourceInput';

export function RecapForm({ recap }: { recap?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(recap?.title || '');
  const [slug, setSlug] = useState(recap?.slug || '');
  const [description, setDescription] = useState(recap?.description || '');
  const [articleContent, setArticleContent] = useState(recap?.article_content || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(recap?.thumbnail_url || '');
  const [language, setLanguage] = useState(recap?.language || 'en');
  const [isPublished, setIsPublished] = useState(recap?.is_published ?? true);

  // Video & Download sources
  const [videoUrl, setVideoUrl] = useState(recap?.video_url || '');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadEnabled, setDownloadEnabled] = useState(true);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!recap && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) {
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
      description: description.trim() || null,
      article_content: articleContent.trim() || title.trim(),
      thumbnail_url: thumbnailUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      language: language.trim() || 'en',
      status: isPublished ? 'published' : 'draft',
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    try {
      let recapId = recap?.id;
      if (recapId) {
        const { error: err } = await supabase.from('recaps').update(payload).eq('id', recapId);
        if (err) throw err;
      } else {
        const { data: inserted, error: err } = await supabase.from('recaps').insert(payload).select().single();
        if (err) throw err;
        recapId = inserted.id;
      }

      // Sync download option if download enabled and video/download URL exists
      if (recapId) {
        await supabase
          .from('download_options')
          .delete()
          .eq('content_type', 'recap')
          .eq('content_id', recapId);

        if (downloadEnabled && (downloadUrl.trim() || videoUrl.trim())) {
          const effectiveDl = downloadUrl.trim() || videoUrl.trim();
          await supabase.from('download_options').insert({
            content_type: 'recap',
            content_id: recapId,
            quality: '1080p',
            format: effectiveDl.endsWith('.mp4') ? 'mp4' : 'video',
            file_size_bytes: 1024 * 1024 * 150,
            protected_file_reference: effectiveDl,
            authorization_status: 'approved',
            is_active: true,
          });
        }
      }

      router.push('/admin/recaps');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save recap');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-bg-card border border-line rounded-xl p-6">
      <div className="flex items-center gap-3 pb-3 border-b border-line">
        <div className="p-2 rounded-lg bg-gold/10 text-gold">
          <BookOpen size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-ink text-base">{recap?.id ? 'Edit Recap' : 'Add New Recap'}</h2>
          <p className="text-xs text-ink-faint">Video recap breakdown, story summaries, and downloadable clips.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Recap Title *</label>
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
        <label className="block text-xs text-ink-dim mb-1 font-medium">Short Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      <div>
        <label className="block text-xs text-ink-dim mb-1 font-medium">Article Summary Content</label>
        <textarea
          rows={4}
          value={articleContent}
          onChange={(e) => setArticleContent(e.target.value)}
          placeholder="Detailed breakdown and notes of the recap..."
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      {/* Recap Cover / Thumbnail with Upload & URL */}
      <ImageInput
        label="Recap Cover / Thumbnail"
        aspectHint="16:9 banner"
        value={thumbnailUrl}
        onChange={setThumbnailUrl}
        folder="recaps"
      />

      {/* Recap Video Source with File upload, M3U8, MPD, MP4, and Download option */}
      <VideoSourceInput
        label="Recap Video Source (Upload File or URL: MP4, M3U8, MPD, Google Drive)"
        videoUrl={videoUrl}
        onChangeVideoUrl={setVideoUrl}
        downloadUrl={downloadUrl}
        onChangeDownloadUrl={setDownloadUrl}
        downloadEnabled={downloadEnabled}
        onChangeDownloadEnabled={setDownloadEnabled}
        showQualities={false}
        showSubtitles={false}
        folder="recaps"
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
          {recap?.id ? 'Update Recap' : 'Publish Recap'}
        </button>
      </div>
    </form>
  );
}
