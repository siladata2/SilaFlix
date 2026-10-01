// Helpers to normalize and resolve video URLs (Google Drive, YouTube, direct MP4, HLS, DASH, MPEG-TS)

export interface ParsedVideoSource {
  type: 'hls' | 'dash' | 'youtube' | 'gdrive' | 'direct';
  streamUrl: string;
  proxyUrl?: string;
  downloadUrl?: string;
  embedUrl?: string;
  isEmbed?: boolean;
  token?: string;
}

const SHIELD_KEY = 'SILAFLIX_SHIELD_KEY_2026_SECURE';

export function encodeStreamToken(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const bytes = new TextEncoder().encode(rawUrl);
    const keyBytes = new TextEncoder().encode(SHIELD_KEY);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    let hex = 'sf1_';
    for (let i = 0; i < out.length; i++) {
      hex += out[i].toString(16).padStart(2, '0');
    }
    return hex;
  } catch {
    return '';
  }
}

export function decodeStreamToken(token: string): string {
  if (!token) return '';
  if (!token.startsWith('sf1_')) return token;
  try {
    const hex = token.slice(4);
    const len = Math.floor(hex.length / 2);
    const bytes = new Uint8Array(len);
    const keyBytes = new TextEncoder().encode(SHIELD_KEY);
    for (let i = 0; i < len; i++) {
      const b = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      bytes[i] = b ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

export function normalizeVideoUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('sf1_')) {
    return normalizeVideoUrl(decodeStreamToken(trimmed));
  }
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function parseGoogleDriveUrl(
  url: string
): { fileId: string; streamUrl: string; downloadUrl: string; previewUrl: string; token: string } | null {
  if (!url) return null;
  const normalized = normalizeVideoUrl(url);
  if (
    !normalized.includes('drive.google.com') &&
    !normalized.includes('docs.google.com') &&
    !normalized.includes('drive.usercontent.google.com')
  ) {
    return null;
  }
  const match =
    normalized.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    normalized.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!match) return null;

  const fileId = match[1];
  const rawDriveUrl = `https://drive.google.com/file/d/${fileId}/view`;
  const rawDownload = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const token = encodeStreamToken(rawDriveUrl);
  return {
    fileId,
    token,
    streamUrl: `/api/gdrive-stream?token=${token}`,
    downloadUrl: `/api/downloads/direct?token=${encodeStreamToken(rawDownload)}`,
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
  };
}

export function parseYouTubeUrl(
  url: string
): { videoId: string; embedUrl: string; watchUrl: string } | null {
  if (!url) return null;
  const normalized = normalizeVideoUrl(url);

  const standardMatch = normalized.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|live\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (standardMatch) {
    const videoId = standardMatch[1];
    return {
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  if (
    normalized.includes('youtube.com') ||
    normalized.includes('youtube-nocookie.com') ||
    normalized.includes('tvgarden.world')
  ) {
    const docIdMatch =
      normalized.match(/[?&]docid=([\w-]{11})/) ||
      normalized.match(/watch%3Fv%3D([\w-]{11})/);
    if (docIdMatch) {
      const videoId = docIdMatch[1];
      return {
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
  }

  return null;
}

export function detectVideoType(
  url: string
): 'hls' | 'dash' | 'mp4' | 'youtube' | 'gdrive' | 'generic' {
  if (!url) return 'generic';
  if (url.startsWith('/api/stream-proxy')) return 'hls';
  if (url.startsWith('/api/gdrive-stream')) return 'gdrive';
  const clean = normalizeVideoUrl(url).toLowerCase();

  if (parseYouTubeUrl(clean)) {
    return 'youtube';
  }
  if (parseGoogleDriveUrl(clean)) {
    return 'gdrive';
  }
  if (
    clean.includes('.m3u8') ||
    clean.includes('/hls/') ||
    clean.includes('format=m3u8') ||
    clean.includes('/manifest/') ||
    clean.includes('playlist.m3u8') ||
    clean.includes('chunks.m3u8') ||
    clean.endsWith('.ts') ||
    clean.includes('.ts?')
  ) {
    return 'hls';
  }
  if (clean.includes('.mpd') || clean.includes('/dash/') || clean.includes('format=mpd')) {
    return 'dash';
  }
  if (
    clean.includes('.mp4') ||
    clean.includes('.webm') ||
    clean.includes('.mov') ||
    clean.includes('.mkv') ||
    clean.includes('.avi')
  ) {
    return 'mp4';
  }
  return 'generic';
}

/**
 * Returns true only for downloadable movie files (Google Drive, .mp4, .mkv, .webm, .avi, .mov)
 * and false for live HLS (.m3u8 / .ts) or YouTube streams.
 */
export function isDownloadableSource(url?: string | null): boolean {
  if (!url) return false;
  const kind = detectVideoType(url);
  return kind === 'gdrive' || kind === 'mp4';
}

export function resolvePlaybackSource(url?: string | null): ParsedVideoSource {
  if (!url || !url.trim()) {
    return { type: 'direct', streamUrl: '' };
  }

  const trimmed = url.trim();
  if (trimmed.startsWith('/api/stream-proxy')) {
    return {
      type: 'hls',
      streamUrl: trimmed,
      proxyUrl: trimmed,
      downloadUrl: trimmed.replace('/api/stream-proxy', '/api/downloads/direct'),
    };
  }
  if (trimmed.startsWith('/api/gdrive-stream')) {
    return {
      type: 'gdrive',
      streamUrl: trimmed,
      proxyUrl: trimmed,
      isEmbed: false,
    };
  }

  const clean = normalizeVideoUrl(trimmed);
  const yt = parseYouTubeUrl(clean);
  if (yt) {
    return {
      type: 'youtube',
      streamUrl: yt.embedUrl,
      embedUrl: yt.embedUrl,
      isEmbed: true,
    };
  }

  const gd = parseGoogleDriveUrl(clean);
  if (gd) {
    return {
      type: 'gdrive',
      streamUrl: gd.streamUrl,
      proxyUrl: gd.streamUrl,
      embedUrl: gd.previewUrl,
      downloadUrl: gd.downloadUrl,
      token: gd.token,
      isEmbed: false,
    };
  }

  const detected = detectVideoType(clean);
  const token = encodeStreamToken(clean);
  const proxyUrl = `/api/stream-proxy?token=${token}`;
  const protectedDownloadUrl = `/api/downloads/direct?token=${token}`;

  if (detected === 'hls') {
    return {
      type: 'hls',
      streamUrl: proxyUrl,
      proxyUrl,
      token,
    };
  }
  if (detected === 'dash') {
    return {
      type: 'dash',
      streamUrl: proxyUrl,
      proxyUrl,
      token,
    };
  }

  return {
    type: 'direct',
    streamUrl: proxyUrl,
    proxyUrl,
    downloadUrl: protectedDownloadUrl,
    token,
  };
}
