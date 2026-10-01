import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encodeStreamToken, parseGoogleDriveUrl } from '@/lib/videoUtils';

const SIGNED_URL_TTL_SECONDS = 15 * 60; // 15 minutes

/**
 * Issues a protected, tokenized download URL (/api/downloads/direct?token=...)
 * so the raw storage / Google Drive / CDN link is never exposed to the client.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const hasSbCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-'));

  let user: any = null;
  if (hasSbCookie) {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch {
      user = null;
    }
  }

  const admin = createAdminClient();
  const { data: option } = await admin
    .from('download_options')
    .select('*')
    .eq('id', params.id)
    .eq('authorization_status', 'approved')
    .eq('is_active', true)
    .maybeSingle();

  if (!option) {
    return NextResponse.json(
      { error: 'This download is not currently available or authorized' },
      { status: 404 }
    );
  }

  const fileRef = option.protected_file_reference;
  let finalDownloadUrl = fileRef;

  const gd = parseGoogleDriveUrl(fileRef);
  if (gd) {
    finalDownloadUrl = `https://drive.google.com/uc?export=download&id=${gd.fileId}`;
  } else if (fileRef.startsWith('http://') || fileRef.startsWith('https://')) {
    finalDownloadUrl = fileRef;
  } else {
    const { data: signed } = await admin.storage
      .from('media')
      .createSignedUrl(fileRef, SIGNED_URL_TTL_SECONDS);

    if (signed?.signedUrl) {
      finalDownloadUrl = signed.signedUrl;
    }
  }

  const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

  await admin.from('download_access_logs').insert({
    user_id: user?.id ?? null,
    download_option_id: option.id,
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    user_agent: req.headers.get('user-agent'),
    expires_at: expiresAt,
  });

  const protectedToken = encodeStreamToken(finalDownloadUrl);

  return NextResponse.json({
    url: `/api/downloads/direct?token=${protectedToken}`,
    expiresAt,
  });
}
