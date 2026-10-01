import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bodySchema = z.object({
  content_type: z.enum(['movie', 'series', 'episode', 'reel', 'recap']),
  content_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  // RLS (watchlists_owner_only) still enforces user_id = auth.uid() server-side.
  const { error } = await supabase.from('watchlists').insert({
    user_id: user.id,
    content_type: parsed.data.content_type,
    content_id: parsed.data.content_id,
  });
  if (error && error.code !== '23505') return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('user_id', user.id)
    .eq('content_type', parsed.data.content_type)
    .eq('content_id', parsed.data.content_id);
  if (error) return NextResponse.json({ error: 'Could not remove' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
