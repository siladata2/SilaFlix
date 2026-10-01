import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reportSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const parsed = reportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { error } = await supabase.from('reports').insert({ ...parsed.data, reporter_id: user.id });
  if (error) return NextResponse.json({ error: 'Could not submit report' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
