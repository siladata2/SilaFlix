import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolvePlaybackSource } from '@/lib/videoUtils';

/**
 * Enhanced playback resolver:
 * Checks movies / episodes / movie_sources / episode_sources.
 * Resolves Google Drive, YouTube embeds, HLS, DASH, or direct MP4 streams.
 */
export async function GET(req: NextRequest) {
  const admin = createAdminClient();

  const type = req.nextUrl.searchParams.get('type');
  const id = req.nextUrl.searchParams.get('id');

  if (!id || (type !== 'movie' && type !== 'episode' && type !== 'recap' && type !== 'reel')) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  let rawUrl: string | null = null;
  let title = '';
  let poster = '';
  let qualities: any[] = [];
  let subtitles: any[] = [];

  if (type === 'movie') {
    const { data: movie } = await admin
      .from('movies')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (movie) {
      rawUrl = movie.trailer_url || null; // fallback
      title = movie.title;
      poster = movie.backdrop_url || movie.poster_url || '';
    }

    // Check movie_sources
    const { data: sources } = await admin
      .from('movie_sources')
      .select('*')
      .eq('movie_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sources && sources.length > 0) {
      // Pick top source
      rawUrl = sources[0].external_id;
      qualities = sources.map((s) => ({
        quality: s.quality || '1080p',
        url: s.external_id,
      }));
    }
  } else if (type === 'episode') {
    const { data: ep } = await admin
      .from('episodes')
      .select('*, series(title)')
      .eq('id', id)
      .maybeSingle();

    if (ep) {
      title = `${ep.series?.title ? ep.series.title + ' - ' : ''}${ep.title}`;
      poster = ep.thumbnail_url || '';
    }

    const { data: sources } = await admin
      .from('episode_sources')
      .select('*')
      .eq('episode_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sources && sources.length > 0) {
      rawUrl = sources[0].external_id;
      qualities = sources.map((s) => ({
        quality: s.quality || '720p',
        url: s.external_id,
      }));
    }
  } else if (type === 'recap') {
    const { data: recap } = await admin
      .from('recaps')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (recap) {
      rawUrl = recap.video_url;
      title = recap.title;
      poster = recap.thumbnail_url || '';
    }
  } else if (type === 'reel') {
    const { data: reel } = await admin
      .from('reels')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (reel) {
      rawUrl = reel.video_url;
      title = reel.title;
      poster = reel.thumbnail_url || '';
    }
  }

  if (!rawUrl) {
    return NextResponse.json({ error: 'No video stream available for this title' }, { status: 404 });
  }

  // Check if there are authorized download options
  const { data: downloadOpts } = await admin
    .from('download_options')
    .select('*')
    .eq('content_type', type)
    .eq('content_id', id)
    .eq('is_active', true)
    .eq('authorization_status', 'approved');

  const resolved = resolvePlaybackSource(rawUrl);

  const downloadUrl = downloadOpts?.[0]?.protected_file_reference || resolved.downloadUrl || null;
  const isDownloadEnabled = (downloadOpts && downloadOpts.length > 0) || Boolean(resolved.downloadUrl);

  return NextResponse.json({
    url: resolved.streamUrl,
    embedUrl: resolved.embedUrl,
    type: resolved.type,
    isEmbed: resolved.isEmbed,
    title,
    poster,
    qualities,
    subtitles,
    downloadUrl,
    isDownloadEnabled,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  });
}
