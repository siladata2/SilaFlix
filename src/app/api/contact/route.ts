import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contactFormSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 });

  // Honeypot: a filled "website" field means a bot filled every input.
  if (parsed.data.website) return NextResponse.json({ ok: true }); // pretend success, drop silently

  const supabase = createClient();
  const { website, ...toStore } = parsed.data;
  const { error } = await supabase.from('contact_submissions').insert(toStore);
  if (error) return NextResponse.json({ error: 'Could not send your message — try again shortly.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
