import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRoleForApi } from '@/lib/auth';
import { movieInputSchema } from '@/lib/validations';

/**
 * Reference CRUD pattern for admin-managed content. The same shape
 * (requireRoleForApi -> validate -> mutate -> audit log) applies to series,
 * episodes, reels, recaps, and categories.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const status = req.nextUrl.searchParams.get('status');
  let query = supabase.from('movies').select('*').order('created_at', { ascending: false }).limit(50);
  if (status) query = query.eq('status', status as any);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load movies' }, { status: 500 });
  return NextResponse.json({ movies: data });
}

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireRoleForApi('editor');
  if (!session) return NextResponse.json({ error: authError.message }, { status: authError.status });

  const parsed = movieInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = createClient();
  const { data, error } = await supabase
    .from('movies')
    .insert({
      ...parsed.data,
      created_by: session.user.id,
      status: parsed.data.is_published ? 'published' : 'draft',
    } as any)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Could not create movie — check the slug is unique' }, { status: 400 });

  await supabase.from('audit_logs').insert({
    actor_id: session.user.id,
    action: 'movie.create',
    entity_type: 'movie',
    entity_id: (data as any).id,
    metadata: { title: (data as any).title },
  });

  return NextResponse.json({ movie: data }, { status: 201 });
}

