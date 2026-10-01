// Server-side Supabase client for Server Components, Route Handlers, and
// Server Actions. Filters out expired `sb-*` auth cookies and wraps fetch
// so transient network errors never throw unhandled `Failed to fetch`.
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';
import { isExpiredOrInvalidSbCookie, safeSupabaseFetch } from './cookieUtils';

export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createServerClient<Database>(url, key, {
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
        try {
          const val = cookieStore.get(name)?.value;
          if (name.startsWith('sb-') && isExpiredOrInvalidSbCookie(val)) {
            return undefined;
          }
          return val;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — safe to ignore
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Called from a Server Component — safe to ignore
        }
      },
    },
  });
}
