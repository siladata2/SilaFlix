import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Newspaper, Play } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Story Recaps - SilaFlix',
  description: 'Catch up on movie highlights and episodic narrative breakdowns on SilaFlix',
};

export default async function RecapsListingPage() {
  const supabase = createClient();
  const { data: recaps } = await supabase
    .from('recaps')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-bg text-ink pt-28 pb-24 wrap">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Story Recaps</h1>
          <p className="text-sm text-ink-dim mt-1">
            Fast-paced video summaries and article breakdowns to catch up on storylines.
          </p>
        </div>
      </div>

      {(recaps ?? []).length === 0 ? (
        <div className="bg-bg-card border border-line rounded-xl p-12 text-center text-ink-dim text-sm">
          <Newspaper size={36} className="mx-auto mb-2 text-ink-faint" />
          No recaps published yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recaps!.map((recap) => (
            <Link
              key={recap.id}
              href={`/recaps/${recap.slug}`}
              className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-gold/50 transition-all shadow-sm flex flex-col"
            >
              <div className="aspect-[16/9] relative bg-bg-raised overflow-hidden">
                {recap.thumbnail_url ? (
                  <img
                    src={recap.thumbnail_url}
                    alt={recap.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-faint">
                    <Newspaper size={28} />
                  </div>
                )}
                {recap.video_url && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gold text-[#171412] flex items-center justify-center shadow-lg">
                      <Play size={20} className="fill-current ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white group-hover:text-gold transition-colors line-clamp-2">
                    {recap.title}
                  </h3>
                  {recap.description && (
                    <p className="text-xs text-ink-dim line-clamp-2 mt-1.5 leading-relaxed">
                      {recap.description}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between text-[11px] text-ink-faint">
                  <span className="uppercase text-gold font-mono">{recap.language || 'en'}</span>
                  <span>Read & Watch →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
