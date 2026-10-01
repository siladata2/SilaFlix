import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/admin/StatCard';

export default async function AdminAnalyticsPage() {
  const supabase = createClient();
  const { data: topMovies } = await supabase.from('movies').select('title, view_count').order('view_count', { ascending: false }).limit(10);
  const { count: downloadCount } = await supabase.from('download_access_logs').select('id', { count: 'exact', head: true });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total downloads issued" value={downloadCount ?? 0} />
      </div>
      <h2 className="font-display text-lg mb-3">Top movies by views</h2>
      <div className="border border-line rounded-xl overflow-hidden">
        {(topMovies ?? []).map((m, i) => (
          <div key={m.title} className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0">
            <span className="text-sm"><span className="text-ink-faint mr-2">{i + 1}.</span>{m.title}</span>
            <span className="text-ink-faint text-sm">{m.view_count.toLocaleString()} views</span>
          </div>
        ))}
      </div>
      <p className="text-ink-faint text-xs mt-6">
        view_count currently increments via application code when playback starts (not included in this scaffold —
        add an UPDATE in the /api/playback route, or a Supabase Edge Function trigger, to wire it up).
        Recommendations elsewhere in the app are rule-based (popularity/recency), not AI-powered, unless you build that separately.
      </p>
    </div>
  );
}
