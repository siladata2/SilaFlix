import { createAdminClient } from '@/lib/supabase/admin';
import { SimpleContentManager, type AdminMovieItem } from '@/components/admin/SimpleContentManager';

export const dynamic = 'force-dynamic';

export default async function AdminMoviesPage() {
  const admin = createAdminClient();
  const [moviesRes, downloadsRes] = await Promise.all([
    admin
      .from('movies')
      .select('*, movie_sources(external_id)')
      .order('updated_at', { ascending: false })
      .limit(100),
    admin
      .from('download_options')
      .select('content_id')
      .eq('content_type', 'movie')
      .eq('authorization_status', 'approved')
      .eq('is_active', true),
  ]);

  const downloadableSet = new Set(
    ((downloadsRes.data as any[]) || []).map((d) => d.content_id)
  );

  const items: AdminMovieItem[] = ((moviesRes.data as any[]) || []).map((m) => {
    const isLive = (m.content_rating || '').toUpperCase().includes('LIVE');
    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      synopsis: m.synopsis,
      poster_url: m.poster_url,
      backdrop_url: m.backdrop_url,
      trailer_url: m.trailer_url,
      release_year: m.release_year,
      language: m.language,
      content_rating: m.content_rating,
      is_published: m.is_published,
      status: m.status,
      primary_source: m.movie_sources?.[0]?.external_id || m.trailer_url || '',
      allow_download: !isLive && downloadableSet.has(m.id),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Movies & Live TV Management
        </h1>
        <p className="text-xs text-ink-dim mt-1">
          Add, edit, or delete titles, configure download permissions for movies, or switch availability status.
        </p>
      </div>

      <SimpleContentManager initialItems={items} />
    </div>
  );
}
