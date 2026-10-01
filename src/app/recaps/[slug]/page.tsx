import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlayButton } from '@/components/player/PlayButton';
import { DownloadList } from '@/components/DownloadList';
import { BookOpen, Sparkles, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: recap } = await supabase
    .from('recaps')
    .select('title, description')
    .eq('slug', params.slug)
    .maybeSingle();

  return {
    title: recap ? `${recap.title} - SilaFlix Recap` : 'Recap Details',
    description: recap?.description || 'Story summary and recap on SilaFlix',
  };
}

export default async function RecapDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: recap } = await supabase
    .from('recaps')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!recap) notFound();

  // Load download options if any
  const { data: downloadOptions } = await supabase
    .from('download_options')
    .select('*')
    .eq('content_type', 'recap')
    .eq('content_id', recap.id)
    .eq('authorization_status', 'approved')
    .eq('is_active', true);

  return (
    <div className="min-h-screen bg-bg text-ink pb-24">
      {/* Header */}
      <div className="relative w-full h-[50vh] min-h-[380px] max-h-[550px] overflow-hidden bg-black select-none">
        {recap.thumbnail_url ? (
          <img
            src={recap.thumbnail_url}
            alt={recap.title}
            className="w-full h-full object-cover filter brightness-[0.65]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1c1815] to-[#0f0e0d]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="relative wrap h-full flex flex-col justify-end pb-12 z-10">
          <span className="bg-gold text-[#171412] px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider w-max mb-2">
            Story Recap
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight mb-3">
            {recap.title}
          </h1>
          {recap.video_url && (
            <div className="mt-2">
              <PlayButton
                contentType="recap"
                contentId={recap.id}
                title={recap.title}
                poster={recap.thumbnail_url || undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="wrap mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {recap.description && (
            <div className="p-4 rounded-xl border border-line bg-bg-card text-ink-dim text-sm italic">
              &ldquo;{recap.description}&rdquo;
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-gold" /> Article Breakdown
            </h2>
            <div className="text-ink text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4">
              {recap.article_content || recap.title}
            </div>
          </div>

          {/* Download System */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-gold" /> Offline Downloads
            </h2>
            {downloadOptions && downloadOptions.length > 0 ? (
              <DownloadList options={downloadOptions as any} />
            ) : (
              <div className="p-4 rounded-xl border border-line bg-bg-card text-xs text-ink-faint">
                No authorized offline downloads available for this recap.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {recap.thumbnail_url && (
            <div className="rounded-xl overflow-hidden border border-line shadow-lg aspect-[16/9]">
              <img src={recap.thumbnail_url} alt={recap.title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
