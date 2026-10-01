// Helpers to validate Supabase SSR auth cookies and provide a resilient fetch wrapper
// that prevents unhandled `TypeError: Failed to fetch` or `AuthApiError` crashes.

const BASE64_PREFIX = 'base64-';

export function isExpiredOrInvalidSbCookie(rawValue: string | undefined): boolean {
  if (!rawValue) return true;
  try {
    let jsonStr = rawValue;
    if (jsonStr.startsWith(BASE64_PREFIX)) {
      const b64 = jsonStr.slice(BASE64_PREFIX.length);
      jsonStr =
        typeof Buffer !== 'undefined'
          ? Buffer.from(b64, 'base64url').toString('utf-8')
          : atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (jsonStr.startsWith('%7B') || jsonStr.startsWith('%22')) {
      jsonStr = decodeURIComponent(jsonStr);
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return true;

    if (!parsed.access_token || !parsed.refresh_token) {
      return true;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof parsed.expires_at === 'number' && parsed.expires_at <= nowSec + 60) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function safeSupabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      cache: 'no-store',
    });
  } catch {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
