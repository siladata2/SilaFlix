import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { safeSupabaseFetch } from './cookieUtils';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: safeSupabaseFetch,
    },
  });
}
