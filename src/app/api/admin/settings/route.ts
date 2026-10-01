import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DEFAULT_SPLASH_URL = 'https://i.ibb.co/93Gb20Zq/Sila-Flix.jpg';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('app_settings').select('*');
    const rows = data || [];
    const getVal = (key: string, fallback: string) => {
      const found = rows.find((r: any) => r.key === key);
      if (!found || found.value === null || found.value === undefined) return fallback;
      return typeof found.value === 'string' ? found.value : String(found.value);
    };

    return NextResponse.json({
      site_name: getVal('site_name', 'SilaFlix'),
      support_phone: getVal('support_phone', '+255789661031'),
      support_email: getVal('support_email', 'support@silaflix.com'),
      splash_wallpaper_url: getVal('splash_wallpaper_url', DEFAULT_SPLASH_URL),
      splash_duration_seconds: Number(getVal('splash_duration_seconds', '3')) || 3,
    });
  } catch {
    return NextResponse.json({
      site_name: 'SilaFlix',
      support_phone: '+255789661031',
      support_email: 'support@silaflix.com',
      splash_wallpaper_url: DEFAULT_SPLASH_URL,
      splash_duration_seconds: 3,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const body = await req.json();
    const entries: { key: string; value: any; updated_at: string }[] = [];
    const now = new Date().toISOString();

    for (const key of [
      'site_name',
      'support_phone',
      'support_email',
      'splash_wallpaper_url',
      'splash_duration_seconds',
    ]) {
      if (body[key] !== undefined) {
        entries.push({ key, value: String(body[key]), updated_at: now });
      }
    }

    if (entries.length > 0) {
      const { error } = await admin.from('app_settings').upsert(entries, { onConflict: 'key' });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
