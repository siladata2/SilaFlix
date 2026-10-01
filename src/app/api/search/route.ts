import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Debounced client calls this for search suggestions across content types. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ movies: [], series: [], recaps: [] });

  const supabase = createClient();
  const like = `%${q}%`;

  const [movies, series, recaps] = await Promise.all([
    supabase.from('movies').select('id, title, slug, poster_url, release_year').eq('is_published', true).ilike('title', like).limit(8),
    supabase.from('series').select('id, title, slug, poster_url').eq('is_published', true).ilike('title', like).limit(8),
    supabase.from('recaps').select('id, title, slug, thumbnail_url').eq('is_published', true).ilike('title', like).limit(8),
  ]);

  return NextResponse.json({
    movies: movies.data ?? [],
    series: series.data ?? [],
    recaps: recaps.data ?? [],
  });
}
