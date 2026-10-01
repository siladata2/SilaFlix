import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { movieInputSchema } from '@/lib/validations';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  if (!profile || !['moderator', 'editor', 'admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = movieInputSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase.from('movies').update(parsed.data).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 400 });

  await supabase.from('audit_logs').insert({ actor_id: user.id, action: 'movie.update', entity_type: 'movie', entity_id: params.id, metadata: parsed.data });

  return NextResponse.json({ movie: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  const { error } = await supabase.from('movies').update({ status: 'archived', is_published: false }).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Could not archive movie' }, { status: 400 });

  await supabase.from('audit_logs').insert({ actor_id: user.id, action: 'movie.archive', entity_type: 'movie', entity_id: params.id });

  return NextResponse.json({ ok: true });
}
