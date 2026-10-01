# Security checklist

- [x] RLS enabled on every table holding user data or unpublished content
      (`supabase/migrations/0010_row_level_security.sql`)
- [x] Roles read from `profiles.role` via `security definer` functions —
      never trusted from a client-supplied JWT claim or request body
- [x] Service-role client (`lib/supabase/admin.ts`) is `server-only` and
      only imported from Route Handlers, gated behind `import 'server-only'`
- [x] `download_options.protected_file_reference` is never selected in a
      client-facing query — explicit column lists exclude it everywhere
      except the admin-only and service-role paths
- [x] Signed download URLs expire (15 min default) and every issuance is
      logged to `download_access_logs` with a basic per-user rate limit
- [x] Zod validation on every mutating API route (`lib/validations.ts`)
- [x] HTML sanitization for user-authorable content (`lib/sanitize.ts`,
      used before `dangerouslySetInnerHTML` on recap articles)
- [x] Security headers set globally (`next.config.mjs`: CSP, X-Frame-Options,
      nosniff, Referrer-Policy, Permissions-Policy)
- [x] Contact form has a honeypot field against basic bot spam
- [x] Audit logging on admin mutations (movie create/update/archive shown
      as the reference pattern — replicate for series/episodes/etc.)
- [x] `audit_logs` has no update/delete RLS policy — append-only

## Still to do before production
- [ ] Add real per-IP rate limiting at the edge (Vercel/Cloudflare) for
      `/api/*` routes generally — the download route's DB-based limit is a
      floor, not a complete solution
- [ ] Add CSRF protection review for any non-GET route if you introduce
      cookie-based auth flows beyond what `@supabase/ssr` already handles
- [ ] Configure Supabase Auth email templates and rate limits in the dashboard
- [ ] Add file-type/size validation on the actual upload path once you wire
      up admin poster/backdrop uploads to Supabase Storage (not included —
      the forms currently take a URL, not a file input)
- [ ] Penetration-test the RLS policies with real role-scoped sessions,
      not just read the SQL
- [ ] Review `next.config.mjs`'s CSP `script-src 'unsafe-inline'` — tighten
      to nonces/hashes if you add more inline scripts
