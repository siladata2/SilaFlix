import https from 'node:https';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { NextRequest, NextResponse } from 'next/server';
import { decodeStreamToken, parseGoogleDriveUrl } from '@/lib/videoUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface GDriveMeta {
  duration: number;
  isNativeMp4: boolean;
  totalBytes?: number;
}

const CHUNK_WINDOW_BYTES = 16 * 1024 * 1024; // 16 MB bounded range window

// Pre-seeded metadata for catalog Google Drive movies + runtime cache for newly added links
const metaCache = new Map<string, GDriveMeta>([
  ['1gIvp8WQiJ1eozCEu4njqqQ7mRxXFVEqw', { duration: 5460, isNativeMp4: false }], // Forgive Us All (AVI)
  ['1lx_VD3oYfG8JBXz2bRgjv_G2X42hjl4U', { duration: 5520, isNativeMp4: false }], // Mutiny (AVI)
  ['1Ahd1X4lqOl5MjqPwr2PcEsJ1WGg2hAiF', { duration: 6420, isNativeMp4: true, totalBytes: 752283793 }], // Shelter (MP4)
  ['1YDJnBrxnk3YNzv1mTLZthpaEZsdBDgb9', { duration: 6000, isNativeMp4: false }], // Occupation: Rainfall (AVI)
]);

function openUpstreamStream(
  targetUrl: string,
  rangeHeader: string | null,
  redirectsLeft = 5
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; stream: http.IncomingMessage }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const reqHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: '*/*',
    };
    if (rangeHeader) {
      reqHeaders['Range'] = rangeHeader;
    }

    const req = client.get(
      targetUrl,
      { headers: reqHeaders, timeout: 15000 },
      (res) => {
        const status = res.statusCode || 200;
        if (
          [301, 302, 303, 307, 308].includes(status) &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          const nextUrl = new URL(res.headers.location, targetUrl).toString();
          openUpstreamStream(nextUrl, rangeHeader, redirectsLeft - 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        resolve({ statusCode: status, headers: res.headers, stream: res });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Upstream request timeout'));
    });
  });
}

function parseTotalBytesFromContentRange(contentRange?: string | string[]): number | undefined {
  if (!contentRange) return undefined;
  const str = Array.isArray(contentRange) ? contentRange[0] : contentRange;
  const match = str.match(/\/(\d+)$/);
  if (match && match[1]) {
    const total = Number(match[1]);
    if (Number.isFinite(total) && total > 0) return total;
  }
  return undefined;
}

function toBoundedRangeHeader(
  incomingRange: string | null,
  totalBytes?: number
): string {
  let start = 0;
  let end: number | null = null;

  if (incomingRange && incomingRange.startsWith('bytes=')) {
    const parts = incomingRange.replace('bytes=', '').split('-');
    const parsedStart = parseInt(parts[0], 10);
    if (!isNaN(parsedStart) && parsedStart >= 0) {
      start = parsedStart;
    }
    if (parts[1] && parts[1].trim() !== '') {
      const parsedEnd = parseInt(parts[1], 10);
      if (!isNaN(parsedEnd) && parsedEnd >= start) {
        end = parsedEnd;
      }
    }
  }

  // Always enforce an explicit end byte so Google Drive returns 206 Partial Content
  // instead of its 200 text/html quota warning page.
  if (end === null) {
    end = start + CHUNK_WINDOW_BYTES - 1;
  }
  if (totalBytes && totalBytes > 0 && end >= totalBytes) {
    end = totalBytes - 1;
  }

  return `bytes=${start}-${end}`;
}

async function probeGDriveMeta(directUrl: string, fileId: string): Promise<GDriveMeta> {
  const cached = metaCache.get(fileId);
  if (cached) return cached;

  try {
    const { headers, stream } = await openUpstreamStream(directUrl, 'bytes=0-1023');
    const firstChunk: Buffer = await new Promise((resolve) => {
      const chunks: Buffer[] = [];
      stream.on('data', (c: Buffer) => {
        chunks.push(c);
        if ( Buffer.concat(chunks).length >= 32) {
          stream.destroy();
          resolve(Buffer.concat(chunks));
        }
      });
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', () => resolve(Buffer.concat(chunks)));
      stream.on('close', () => resolve(Buffer.concat(chunks)));
    });

    const disp = String(headers['content-disposition'] || '').toLowerCase();
    const totalBytes = parseTotalBytesFromContentRange(headers['content-range']);
    const magicAscii = firstChunk.subarray(0, 16).toString('ascii');

    let isNativeMp4 = true;
    if (magicAscii.startsWith('RIFF') || disp.includes('.avi') || disp.includes('.mkv')) {
      isNativeMp4 = false;
    } else if (magicAscii.includes('ftyp') || disp.includes('.mp4') || disp.includes('.m4v')) {
      isNativeMp4 = true;
    }

    const meta: GDriveMeta = {
      duration: isNativeMp4 ? 0 : 5400,
      isNativeMp4,
      totalBytes,
    };
    metaCache.set(fileId, meta);
    return meta;
  } catch {
    return { duration: 5400, isNativeMp4: true };
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const rawUrl = decodeStreamToken(token) || token;
  const gdrive = parseGoogleDriveUrl(rawUrl);

  if (!gdrive) {
    return NextResponse.json({ error: 'Invalid media token' }, { status: 400 });
  }

  const directUrl = `https://drive.usercontent.google.com/download?id=${gdrive.fileId}&export=download&confirm=t`;

  // Fast metadata endpoint for player controls
  if (req.nextUrl.searchParams.get('meta') === '1') {
    const meta = await probeGDriveMeta(directUrl, gdrive.fileId);
    return NextResponse.json(meta, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  const meta = await probeGDriveMeta(directUrl, gdrive.fileId);

  // 1. NATIVE MP4 ON GOOGLE DRIVE: Stream directly using bounded HTTP Range (206 Partial Content)
  // Using bounded ranges guarantees Google Drive serves binary video/mp4 without HTML quota blocks.
  if (meta.isNativeMp4 && !req.nextUrl.searchParams.get('start')) {
    try {
      const incomingRange = req.headers.get('range');
      const boundedRange = toBoundedRangeHeader(incomingRange, meta.totalBytes);
      const { statusCode, headers: upHeaders, stream: nodeStream } = await openUpstreamStream(
        directUrl,
        boundedRange
      );

      const contentType = String(upHeaders['content-type'] || '').toLowerCase();
      if (!contentType.includes('text/html')) {
        const discoveredTotal = parseTotalBytesFromContentRange(upHeaders['content-range']);
        if (discoveredTotal && !meta.totalBytes) {
          meta.totalBytes = discoveredTotal;
          metaCache.set(gdrive.fileId, meta);
        }

        req.signal.addEventListener('abort', () => {
          nodeStream.destroy();
        });

        const webStream = new ReadableStream({
          start(controller) {
            nodeStream.on('data', (chunk: Buffer) => {
              try {
                controller.enqueue(new Uint8Array(chunk));
              } catch {
                nodeStream.destroy();
              }
            });
            nodeStream.on('end', () => {
              try {
                controller.close();
              } catch {}
            });
            nodeStream.on('error', () => {
              try {
                controller.close();
              } catch {}
            });
          },
          cancel() {
            nodeStream.destroy();
          },
        });

        const outHeaders: Record<string, string> = {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        };
        if (upHeaders['content-length']) {
          outHeaders['Content-Length'] = String(upHeaders['content-length']);
        }
        if (upHeaders['content-range']) {
          outHeaders['Content-Range'] = String(upHeaders['content-range']);
        }

        return new NextResponse(webStream, {
          status: statusCode === 206 ? 206 : 200,
          headers: outHeaders,
        });
      } else {
        nodeStream.destroy();
      }
    } catch {
      // Fall through to ffmpeg transcoding if direct range stream fails
    }
  }

  // 2. AVI / MKV CONTAINERS ON GOOGLE DRIVE: Real-time fragmented MP4 transcoding via ffmpeg
  const startParam = parseFloat(req.nextUrl.searchParams.get('start') || '0');
  const startSec = !isNaN(startParam) && startParam > 0 ? Math.floor(startParam) : 0;

  const ffmpegArgs: string[] = ['-hide_banner', '-loglevel', 'error'];

  if (startSec > 0) {
    ffmpegArgs.push('-ss', String(startSec));
  }

  ffmpegArgs.push(
    '-i',
    directUrl,
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-tune',
    'zerolatency',
    '-crf',
    '24',
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-ac',
    '2',
    '-movflags',
    'frag_keyframe+empty_moov+default_base_moof',
    '-f',
    'mp4',
    'pipe:1'
  );

  const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  req.signal.addEventListener('abort', () => {
    ffmpeg.kill('SIGKILL');
  });

  const stream = new ReadableStream({
    start(controller) {
      ffmpeg.stdout.on('data', (chunk: Buffer) => {
        try {
          controller.enqueue(new Uint8Array(chunk));
        } catch {
          ffmpeg.kill('SIGKILL');
        }
      });

      ffmpeg.stdout.on('end', () => {
        try {
          controller.close();
        } catch {}
      });

      ffmpeg.on('error', () => {
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      ffmpeg.kill('SIGKILL');
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
