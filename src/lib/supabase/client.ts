// Browser-side Supabase client. Safe to import from any "use client" component.
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';
import { isExpiredOrInvalidSbCookie, safeSupabaseFetch } from './cookieUtils';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  if (typeof document !== 'undefined') {
    try {
      const cookies = document.cookie.split(';');
      for (const raw of cookies) {
        const [namePart, ...valParts] = raw.trim().split('=');
        if (namePart && namePart.startsWith('sb-')) {
          const val = valParts.join('=');
          if (namePart.endsWith('-auth-token') && isExpiredOrInvalidSbCookie(val)) {
            document.cookie = `${namePart}=; path=/; max-age=0; SameSite=None; Secure`;
            document.cookie = `${namePart}=; path=/; max-age=0`;
          }
        }
      }
    } catch {
      // Ignore cookie cleanup errors
    }
  }

  return createBrowserClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: safeSupabaseFetch,
    },
  });
}
