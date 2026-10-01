// Called from the root middleware.ts — validates the Supabase auth session
// without triggering unhandled AuthApiError or Failed to fetch errors.
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';
import { isExpiredOrInvalidSbCookie, safeSupabaseFetch } from './cookieUtils';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  const allCookies = request.cookies.getAll();
  const sbCookies = allCookies.filter((c) => c.name.startsWith('sb-'));

  if (sbCookies.length === 0) {
    const supabase = createServerClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { fetch: safeSupabaseFetch },
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    });
    return { response, user: null, supabase };
  }

  const mainAuthCookie = sbCookies.find((c) => c.name.endsWith('-auth-token'));
  if (mainAuthCookie && isExpiredOrInvalidSbCookie(mainAuthCookie.value)) {
    sbCookies.forEach((c) => {
      request.cookies.delete(c.name);
    });
    response = NextResponse.next({ request: { headers: request.headers } });
    sbCookies.forEach((c) => {
      response.cookies.delete(c.name);
    });
    const supabase = createServerClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { fetch: safeSupabaseFetch },
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    });
    return { response, user: null, supabase };
  }

  const supabase = createServerClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: safeSupabaseFetch,
    },
    cookies: {
      get(name: string) {
        const val = request.cookies.get(name)?.value;
        if (name.startsWith('sb-') && isExpiredOrInvalidSbCookie(val)) {
          return undefined;
        }
        return val;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      sbCookies.forEach((c) => {
        request.cookies.delete(c.name);
      });
      response = NextResponse.next({ request: { headers: request.headers } });
      sbCookies.forEach((c) => {
        response.cookies.delete(c.name);
      });
      return { response, user: null, supabase };
    }

    return { response, user, supabase };
  } catch {
    sbCookies.forEach((c) => {
      request.cookies.delete(c.name);
    });
    response = NextResponse.next({ request: { headers: request.headers } });
    sbCookies.forEach((c) => {
      response.cookies.delete(c.name);
    });
    return { response, user: null, supabase };
  }
}
