import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({ content_type: z.enum(['movie', 'series', 'episode', 'reel', 'recap']), content_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { error } = await supabase.from('saved_content').insert({ user_id: user.id, ...parsed.data });
  if (error && error.code !== '23505') return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
