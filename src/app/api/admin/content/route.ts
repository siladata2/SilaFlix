import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeVideoUrl, parseGoogleDriveUrl, isDownloadableSource } from '@/lib/videoUtils';

export const dynamic = 'force-dynamic';

function buildContentRating(baseKind: 'movie' | 'live', isMaintenance: boolean, isPaid: boolean): string {
  const parts: string[] = [baseKind === 'live' ? 'LIVE' : 'PG-13'];
  if (isPaid) parts.push('VIP');
  if (isMaintenance) parts.push('MAINTENANCE');
  return parts.join(' · ');
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Global Platform Mode update
  if (body.action === 'platform_mode') {
    const mode = body.mode || 'online'; // 'online' | 'maintenance' | 'offline' | 'paid_vip'
    const price = body.price || 'VIP Pass';
    try {
      await admin.from('app_settings').upsert(
        [
          { key: 'platform_mode', value: mode },
          { key: 'vip_price', value: price },
        ],
        { onConflict: 'key' }
      );
    } catch {
      // Ignore if app_settings key conflict differs
    }

    if (body.applyToAll) {
      const { data: allMovies } = await admin.from('movies').select('id, content_rating');
      if (allMovies) {
        for (const m of allMovies) {
          const isLive = m.content_rating?.toUpperCase().includes('LIVE');
          const kind = isLive ? 'live' : 'movie';
          if (mode === 'maintenance') {
            await admin
              .from('movies')
              .update({
                is_published: true,
                status: 'published',
                content_rating: buildContentRating(kind, true, false),
                updated_at: new Date().toISOString(),
              })
              .eq('id', m.id);
          } else if (mode === 'offline') {
            await admin
              .from('movies')
              .update({
                is_published: false,
                status: 'draft',
                updated_at: new Date().toISOString(),
              })
              .eq('id', m.id);
          } else if (mode === 'paid_vip') {
            await admin
              .from('movies')
              .update({
                is_published: true,
                status: 'published',
                content_rating: buildContentRating(kind, false, true),
                updated_at: new Date().toISOString(),
              })
              .eq('id', m.id);
          } else {
            await admin
              .from('movies')
              .update({
                is_published: true,
                status: 'published',
                content_rating: buildContentRating(kind, false, false),
                updated_at: new Date().toISOString(),
              })
              .eq('id', m.id);
          }
        }
      }
    }

    return NextResponse.json({ ok: true, mode });
  }

  // Create new Movie / Live Channel / Series / Reel
  const {
    title,
    kind = 'movie', // 'movie' | 'live' | 'series' | 'reel'
    streamUrl = '',
    downloadUrl = '',
    posterUrl = '',
    backdropUrl = '',
    synopsis = '',
    language = 'English',
    releaseYear = 2026,
    state = 'online', // 'online' | 'maintenance' | 'offline'
    isPaid = false,
    allowDownload = false,
  } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const cleanTitle = title.trim();
  const baseSlug = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

  const normalizedStream = normalizeVideoUrl(streamUrl);

  if (kind === 'reel') {
    const { data: reel, error } = await admin
      .from('reels')
      .insert({
        title: cleanTitle,
        description: synopsis || null,
        video_url: normalizedStream,
        thumbnail_url: posterUrl || null,
        is_published: state !== 'offline',
        status: state === 'offline' ? 'draft' : 'approved',
      } as any)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (reel && allowDownload && normalizedStream) {
      await admin.from('download_options').insert({
        content_type: 'reel',
        content_id: reel.id,
        quality: '1080p',
        format: 'mp4',
        file_size_bytes: null,
        protected_file_reference: downloadUrl?.trim() || normalizedStream,
        authorization_status: 'approved',
        is_active: true,
      });
    }

    return NextResponse.json({ item: reel });
  }

  if (kind === 'series') {
    const { data: series, error } = await admin
      .from('series')
      .insert({
        title: cleanTitle,
        slug,
        synopsis: synopsis || null,
        poster_url: posterUrl || null,
        backdrop_url: backdropUrl || posterUrl || null,
        language,
        content_rating: buildContentRating('movie', state === 'maintenance', Boolean(isPaid)),
        is_published: state !== 'offline',
        status: state === 'offline' ? 'draft' : 'published',
      } as any)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (normalizedStream && series) {
      const { data: ep } = await admin
        .from('episodes')
        .insert({
          series_id: series.id,
          episode_number: 1,
          title: `${cleanTitle} - Episode 1`,
          synopsis: synopsis || null,
          thumbnail_url: backdropUrl || posterUrl || null,
          is_published: true,
        } as any)
        .select()
        .single();

      if (ep) {
        await admin.from('episode_sources').insert({
          episode_id: ep.id,
          provider: 'external',
          external_id: normalizedStream,
          quality: '1080p',
          is_active: true,
        });
      }
    }

    return NextResponse.json({ item: series });
  }

  // Movie or Live TV Channel
  const isLive = kind === 'live';
  const contentRating = buildContentRating(
    isLive ? 'live' : 'movie',
    state === 'maintenance',
    Boolean(isPaid)
  );

  const nowIso = new Date().toISOString();
  const { data: movie, error: movieErr } = await admin
    .from('movies')
    .insert({
      title: cleanTitle,
      slug,
      synopsis: synopsis || null,
      poster_url:
        posterUrl ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      backdrop_url:
        backdropUrl ||
        posterUrl ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
      trailer_url: normalizedStream || null,
      release_year: Number(releaseYear) || 2026,
      runtime_minutes: isLive ? null : 115,
      language,
      content_rating: contentRating,
      is_featured: true,
      is_published: state !== 'offline',
      status: state === 'offline' ? 'draft' : 'published',
      updated_at: nowIso,
    } as any)
    .select()
    .single();

  if (movieErr) {
    return NextResponse.json({ error: movieErr.message }, { status: 400 });
  }

  if (normalizedStream && movie) {
    await admin.from('movie_sources').insert({
      movie_id: movie.id,
      provider: 'external',
      external_id: normalizedStream,
      quality: '1080p',
      is_active: true,
    });
  }

  // Live TV streams can NEVER be downloaded; only movies where allowDownload is true and source is downloadable
  const targetDlSource = downloadUrl || normalizedStream;
  const shouldCreateDownload =
    !isLive && Boolean(allowDownload) && Boolean(targetDlSource) && isDownloadableSource(targetDlSource);

  if (shouldCreateDownload && movie) {
    const gdrive = parseGoogleDriveUrl(targetDlSource);
    const effectiveDl = gdrive
      ? `https://drive.google.com/uc?export=download&id=${gdrive.fileId}`
      : normalizeVideoUrl(targetDlSource);

    await admin.from('download_options').insert({
      content_type: 'movie',
      content_id: movie.id,
      quality: '1080p',
      format: 'mp4',
      file_size_bytes: 800 * 1024 * 1024,
      protected_file_reference: effectiveDl,
      authorization_status: 'approved',
      is_active: true,
    });
  }

  return NextResponse.json({
    item: {
      ...movie,
      allow_download: shouldCreateDownload,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const admin = createAdminClient();
  const body = await req.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Missing item id' }, { status: 400 });
  }

  const {
    id,
    title,
    kind,
    streamUrl,
    downloadUrl,
    posterUrl,
    backdropUrl,
    synopsis,
    language,
    state, // 'online' | 'maintenance' | 'offline'
    isPaid,
    allowDownload,
  } = body;

  const { data: existing } = await admin.from('movies').select('*').eq('id', id).maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const currentRating = existing.content_rating || 'PG-13';
  const currentIsLive =
    kind === 'live' ||
    (kind === undefined && currentRating.toUpperCase().includes('LIVE'));
  const currentIsMaintenance =
    state !== undefined
      ? state === 'maintenance'
      : currentRating.toUpperCase().includes('MAINTENANCE');
  const currentIsPaid =
    isPaid !== undefined ? Boolean(isPaid) : currentRating.toUpperCase().includes('VIP');
  const currentIsOffline =
    state !== undefined ? state === 'offline' : existing.is_published === false;

  const newRating = buildContentRating(
    currentIsLive ? 'live' : 'movie',
    currentIsMaintenance,
    currentIsPaid
  );

  const updatePayload: Record<string, any> = {
    content_rating: newRating,
    is_published: !currentIsOffline,
    status: currentIsOffline ? 'draft' : 'published',
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updatePayload.title = title.trim();
  if (synopsis !== undefined) updatePayload.synopsis = synopsis.trim() || null;
  if (posterUrl !== undefined) updatePayload.poster_url = posterUrl.trim() || null;
  if (backdropUrl !== undefined) updatePayload.backdrop_url = backdropUrl.trim() || null;
  if (language !== undefined) updatePayload.language = language.trim() || 'English';
  if (streamUrl !== undefined && streamUrl.trim()) {
    updatePayload.trailer_url = normalizeVideoUrl(streamUrl);
  }

  const { data: updated, error } = await admin
    .from('movies')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (streamUrl !== undefined && streamUrl.trim()) {
    const norm = normalizeVideoUrl(streamUrl);
    await admin.from('movie_sources').delete().eq('movie_id', id);
    await admin.from('movie_sources').insert({
      movie_id: id,
      provider: 'external',
      external_id: norm,
      quality: '1080p',
      is_active: true,
    });
  }

  let finalAllowDownload: boolean | undefined = undefined;

  if (currentIsLive) {
    // Live streams can never have download options
    await admin.from('download_options').delete().eq('content_type', 'movie').eq('content_id', id);
    finalAllowDownload = false;
  } else if (allowDownload !== undefined) {
    await admin.from('download_options').delete().eq('content_type', 'movie').eq('content_id', id);
    if (allowDownload) {
      const { data: srcRow } = await admin
        .from('movie_sources')
        .select('external_id')
        .eq('movie_id', id)
        .limit(1)
        .maybeSingle();
      const targetDl =
        downloadUrl || streamUrl || srcRow?.external_id || existing.trailer_url || '';
      if (targetDl && isDownloadableSource(targetDl)) {
        const gdrive = parseGoogleDriveUrl(targetDl);
        const effectiveDl = gdrive
          ? `https://drive.google.com/uc?export=download&id=${gdrive.fileId}`
          : normalizeVideoUrl(targetDl);

        await admin.from('download_options').insert({
          content_type: 'movie',
          content_id: id,
          quality: '1080p',
          format: 'mp4',
          file_size_bytes: 800 * 1024 * 1024,
          protected_file_reference: effectiveDl,
          authorization_status: 'approved',
          is_active: true,
        });
        finalAllowDownload = true;
      } else {
        finalAllowDownload = false;
      }
    } else {
      finalAllowDownload = false;
    }
  }

  return NextResponse.json({
    item: {
      ...updated,
      ...(finalAllowDownload !== undefined ? { allow_download: finalAllowDownload } : {}),
    },
  });
}

export async function DELETE(req: NextRequest) {
  const admin = createAdminClient();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await admin.from('movie_sources').delete().eq('movie_id', id);
  await admin.from('download_options').delete().eq('content_type', 'movie').eq('content_id', id);
  const { error } = await admin.from('movies').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
