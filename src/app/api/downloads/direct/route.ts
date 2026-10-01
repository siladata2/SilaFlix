import http from 'node:http';
import https from 'node:https';
import { NextRequest, NextResponse } from 'next/server';
import { decodeStreamToken, normalizeVideoUrl, parseGoogleDriveUrl } from '@/lib/videoUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function openDownloadStream(
  targetUrl: string,
  rangeHeader?: string,
  redirectsLeft = 5
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; stream: http.IncomingMessage }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: '*/*',
    };
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const req = client.get(
      targetUrl,
      { headers, timeout: 20000 },
      (res) => {
        const status = res.statusCode || 200;
        if (
          [301, 302, 303, 307, 308].includes(status) &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          const nextUrl = new URL(res.headers.location, targetUrl).toString();
          openDownloadStream(nextUrl, rangeHeader, redirectsLeft - 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        resolve({ statusCode: status, headers: res.headers, stream: res });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Upstream download timeout'));
    });
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const rawParam = req.nextUrl.searchParams.get('url') || '';
  const titleParam = req.nextUrl.searchParams.get('title') || 'SilaFlix-Video';

  const decoded = token ? decodeStreamToken(token) : normalizeVideoUrl(rawParam);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid download token' }, { status: 400 });
  }

  let targetUrl = decoded;
  const gdrive = parseGoogleDriveUrl(decoded);
  if (gdrive) {
    targetUrl = `https://drive.usercontent.google.com/download?id=${gdrive.fileId}&export=download&confirm=t`;
  }

  const safeFilename =
    titleParam
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'SilaFlix-Movie';

  try {
    const { statusCode, headers: upHeaders, stream: nodeStream } = await openDownloadStream(targetUrl);

    if (statusCode >= 400) {
      nodeStream.destroy();
      return NextResponse.redirect(targetUrl);
    }

    const contentType = String(upHeaders['content-type'] || 'video/mp4');
    if (contentType.includes('text/html') && gdrive) {
      nodeStream.destroy();
      // Stream via sequential 16MB bounded ranges so Google Drive quota HTML page is bypassed
      const chunkSize = 16 * 1024 * 1024;
      let offset = 0;
      let totalSize = 0;
      let aborted = false;

      req.signal.addEventListener('abort', () => {
        aborted = true;
      });

      const firstProbe = await openDownloadStream(targetUrl, `bytes=0-${chunkSize - 1}`);
      const cr = String(firstProbe.headers['content-range'] || '');
      const m = cr.match(/\/(\d+)$/);
      totalSize = m ? Number(m[1]) : 0;

      const disp = String(firstProbe.headers['content-disposition'] || '');
      let ext = 'mp4';
      if (disp.toLowerCase().includes('.avi')) ext = 'avi';
      else if (disp.toLowerCase().includes('.mkv')) ext = 'mkv';

      const webStream = new ReadableStream({
        async start(controller) {
          let currentRes = firstProbe;
          try {
            while (!aborted) {
              await new Promise<void>((resolve, reject) => {
                currentRes.stream.on('data', (chunk: Buffer) => {
                  try {
                    offset += chunk.length;
                    controller.enqueue(new Uint8Array(chunk));
                  } catch (e) {
                    currentRes.stream.destroy();
                    reject(e);
                  }
                });
                currentRes.stream.on('end', () => resolve());
                currentRes.stream.on('error', (e) => reject(e));
              });

              if (aborted || (totalSize > 0 && offset >= totalSize)) {
                break;
              }
              const nextEnd =
                totalSize > 0
                  ? Math.min(offset + chunkSize - 1, totalSize - 1)
                  : offset + chunkSize - 1;
              currentRes = await openDownloadStream(targetUrl, `bytes=${offset}-${nextEnd}`);
            }
            controller.close();
          } catch {
            try {
              controller.close();
            } catch {}
          }
        },
        cancel() {
          aborted = true;
          firstProbe.stream.destroy();
        },
      });

      const outHeaders: Record<string, string> = {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeFilename}.${ext}"`,
        'Cache-Control': 'no-store',
      };
      if (totalSize > 0) {
        outHeaders['Content-Length'] = String(totalSize);
      }

      return new NextResponse(webStream, {
        status: 200,
        headers: outHeaders,
      });
    }

    const disp = String(upHeaders['content-disposition'] || '');
    let ext = 'mp4';
    if (disp.toLowerCase().includes('.avi')) ext = 'avi';
    else if (disp.toLowerCase().includes('.mkv')) ext = 'mkv';

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

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}.${ext}"`,
      'Cache-Control': 'no-store',
    };

    const contentLength = upHeaders['content-length'];
    if (contentLength) {
      headers['Content-Length'] = String(contentLength);
    }

    return new NextResponse(webStream, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.redirect(targetUrl);
  }
}
