import http from 'node:http';
import https from 'node:https';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeVideoUrl, decodeStreamToken, encodeStreamToken } from '@/lib/videoUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface UpstreamResponse {
  res: http.IncomingMessage;
  finalUrl: string;
}

function requestUpstream(
  urlStr: string,
  extraHeaders: Record<string, string>,
  redirectsLeft = 5
): Promise<UpstreamResponse> {
  return new Promise((resolve, reject) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch (err) {
      return reject(err);
    }

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.request(
      parsedUrl,
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Accept: '*/*',
          Connection: 'keep-alive',
          ...extraHeaders,
        },
        timeout: 15000,
      },
      (res) => {
        const status = res.statusCode || 500;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            return reject(new Error('Too many redirects'));
          }
          try {
            const nextUrl = new URL(res.headers.location, parsedUrl).toString();
            return resolve(requestUpstream(nextUrl, extraHeaders, redirectsLeft - 1));
          } catch (err) {
            return reject(err);
          }
        }
        resolve({ res, finalUrl: parsedUrl.toString() });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Upstream request timeout'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function readStreamText(res: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    res.on('error', reject);
  });
}

/**
 * Secure HLS (.m3u8) and (.ts / .m4s / .mp4) Stream Shield Proxy.
 * Uses native node:http / node:https streams so Next.js patched fetch() never attempts
 * to cache >2MB video segments in the Next.js Data Cache.
 */
export async function GET(req: NextRequest) {
  const tokenParam = req.nextUrl.searchParams.get('token');
  const urlParam = req.nextUrl.searchParams.get('url');

  const rawTarget = tokenParam ? decodeStreamToken(tokenParam) : urlParam;
  if (!rawTarget) {
    return NextResponse.json({ error: 'Invalid or missing stream token' }, { status: 400 });
  }

  const targetUrl = normalizeVideoUrl(rawTarget);

  try {
    const forwardHeaders: Record<string, string> = {};
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      forwardHeaders['Range'] = rangeHeader;
    }

    const { res: upstream, finalUrl } = await requestUpstream(targetUrl, forwardHeaders);
    const status = upstream.statusCode || 200;

    if (status >= 400) {
      upstream.resume();
      return NextResponse.json({ error: `Upstream returned ${status}` }, { status });
    }

    const contentType = String(upstream.headers['content-type'] || '');
    const lowerUrl = finalUrl.toLowerCase();
    const isM3u8 =
      contentType.toLowerCase().includes('mpegurl') ||
      contentType.toLowerCase().includes('m3u') ||
      lowerUrl.includes('.m3u8');

    if (isM3u8) {
      const text = await readStreamText(upstream);
      const baseUrl = new URL(finalUrl);

      const rewritten = text
        .split(/\r?\n/)
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;

          if (trimmed.startsWith('#')) {
            return line.replace(/URI="([^"]+)"/g, (_match, uriVal) => {
              try {
                const resolvedUri = new URL(uriVal, baseUrl).toString();
                return `URI="/api/stream-proxy?token=${encodeStreamToken(resolvedUri)}"`;
              } catch {
                return _match;
              }
            });
          }

          try {
            const resolvedUrl = new URL(trimmed, baseUrl).toString();
            return `/api/stream-proxy?token=${encodeStreamToken(resolvedUrl)}`;
          } catch {
            return line;
          }
        })
        .join('\n');

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Stream binary video segment (.ts, .m4s, .mp4, .aac) directly via ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        upstream.on('data', (chunk: Buffer) => {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch {
            upstream.destroy();
          }
        });
        upstream.on('end', () => {
          try {
            controller.close();
          } catch {
            // already closed
          }
        });
        upstream.on('error', (err) => {
          try {
            controller.error(err);
          } catch {
            // ignore
          }
        });
      },
      cancel() {
        upstream.destroy();
      },
    });

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType || 'video/mp2t',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    if (upstream.headers['content-length']) {
      responseHeaders['Content-Length'] = String(upstream.headers['content-length']);
    }
    if (upstream.headers['content-range']) {
      responseHeaders['Content-Range'] = String(upstream.headers['content-range']);
    }
    if (upstream.headers['accept-ranges']) {
      responseHeaders['Accept-Ranges'] = String(upstream.headers['accept-ranges']);
    }

    return new NextResponse(webStream, {
      status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to proxy stream' },
      { status: 502 }
    );
  }
}
