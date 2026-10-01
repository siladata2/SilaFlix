import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Watch history' };

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="wrap pt-32 pb-20">
        <h1 className="font-display text-3xl mb-8">Watch history</h1>
        <EmptyState title="No watch history yet" message="Enjoy streaming your favorite movies and series directly on SilaFlix." />
      </div>
    );
  }

  const { data: history } = await supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', user.id)
    .order('last_watched_at', { ascending: false })
    .limit(50);

  const movieIds = (history ?? []).filter((h) => h.content_type === 'movie').map((h) => h.content_id);
  const { data: movies } = movieIds.length
    ? await supabase.from('movies').select('id, title, slug').in('id', movieIds)
    : { data: [] };
  const titleFor = (id: string) => movies?.find((m) => m.id === id);

  return (
    <div className="wrap pt-32 pb-20">
      <h1 className="font-display text-3xl mb-8">Watch history</h1>
      {(history ?? []).length === 0 ? (
        <EmptyState title="No watch history yet" message="Titles you watch will appear here so you can pick up where you left off." />
      ) : (
        <div className="flex flex-col gap-2">
          {history!.map((h) => {
            const movie = h.content_type === 'movie' ? titleFor(h.content_id) : null;
            const pct = h.duration_seconds ? Math.round((h.progress_seconds / h.duration_seconds) * 100) : 0;
            return (
              <div key={h.id} className="flex items-center justify-between p-4 rounded-lg border border-line bg-bg-card">
                <div>
                  <p className="font-semibold text-sm">{movie?.title ?? `${h.content_type} · ${h.content_id.slice(0, 8)}`}</p>
                  <p className="text-ink-faint text-xs">{pct}% watched · {formatRelativeTime(h.last_watched_at)}</p>
                </div>
                {movie && <Link href={`/title/${movie.slug}`} className="text-gold text-sm font-semibold">Resume</Link>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
