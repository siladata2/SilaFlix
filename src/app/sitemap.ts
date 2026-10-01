import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const supabase = createClient();

  const staticRoutes = ['', '/movies', '/series', '/reels', '/recaps', '/categories', '/about', '/contact', '/help', '/privacy', '/terms', '/copyright']
    .map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  const { data: movies } = await supabase.from('movies').select('slug, updated_at').eq('is_published', true);
  const { data: series } = await supabase.from('series').select('slug, updated_at').eq('is_published', true);

  const movieRoutes = (movies ?? []).map((m) => ({ url: `${base}/title/${m.slug}`, lastModified: new Date(m.updated_at) }));
  const seriesRoutes = (series ?? []).map((s) => ({ url: `${base}/series/${s.slug}`, lastModified: new Date(s.updated_at) }));

  return [...staticRoutes, ...movieRoutes, ...seriesRoutes];
}
