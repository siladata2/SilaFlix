import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const body = await req.json();

    const {
      id,
      title,
      description,
      thumbnail_url,
      video_url,
      download_url,
      download_enabled,
      is_published,
    } = body;

    if (!title?.trim() || !video_url?.trim()) {
      return NextResponse.json(
        { error: 'Title and video URL are required.' },
        { status: 400 }
      );
    }

    const published = is_published !== false;
    const payload: Record<string, any> = {
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      thumbnail_url: thumbnail_url ? String(thumbnail_url).trim() : null,
      video_url: String(video_url).trim(),
      is_published: published,
      status: published ? 'approved' : 'draft',
      updated_at: new Date().toISOString(),
    };

    let reelId = id;

    if (reelId) {
      const { error: updateErr } = await admin
        .from('reels')
        .update(payload)
        .eq('id', reelId);
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from('reels')
        .insert(payload)
        .select('id')
        .single();
      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      reelId = inserted?.id;
    }

    if (reelId) {
      await admin
        .from('download_options')
        .delete()
        .eq('content_type', 'reel')
        .eq('content_id', reelId);

      if (download_enabled && (download_url?.trim() || video_url?.trim())) {
        const dl = String(download_url?.trim() || video_url?.trim());
        await admin.from('download_options').insert({
          content_type: 'reel',
          content_id: reelId,
          quality: '1080p',
          format: 'mp4',
          file_size_bytes: null,
          protected_file_reference: dl,
          authorization_status: 'approved',
          is_active: true,
        });
      }
    }

    return NextResponse.json({ ok: true, id: reelId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save reel' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const { table = 'reels', id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }
    const { error } = await admin
      .from(table)
      .update({
        status,
        is_published: status === 'approved' || status === 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    await admin.from('download_options').delete().eq('content_type', 'reel').eq('content_id', id);
    const { error } = await admin.from('reels').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Delete failed' }, { status: 500 });
  }
}
