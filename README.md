# SilaFlix

**Your World of Entertainment** — a global streaming platform for authorized
movies, series, reels, and movie recaps. Built with Next.js (App Router),
TypeScript, Tailwind CSS, and Supabase (Postgres + Auth + Storage + RLS).

> Support: **+255789661031**

---

## ⚠️ Honest status of this codebase

This was generated in an environment **without network access** — `npm
install`, `next build`, and the test suite have **not been run or verified
here**. Nothing in this README claims otherwise. Before you deploy:

```bash
npm install
npm run build   # will surface any real TypeScript/import errors
npm run test    # runs the two real test files under tests/
```

Fix whatever those commands turn up — treat this as a strong, coherent
starting codebase, not a shrink-wrapped product.

### What's fully built
- **Database**: all 20 tables from the spec, as real SQL migrations
  (`supabase/migrations/0001`–`0011`), with foreign keys, indexes, and
  constraints.
- **RLS**: complete policy set for every table (`0010_row_level_security.sql`),
  documented in `supabase/README.md` and `docs/SECURITY_CHECKLIST.md`.
- **Auth**: Supabase Auth wired end-to-end — register, login, logout, email
  verification, password reset, session refresh middleware, role-based
  route protection (`lib/auth.ts`, `src/middleware.ts`).
- **All public routes** from the spec exist and render real Supabase queries:
  home, movies (list + detail + filters/pagination), series (list + detail +
  seasons/episodes), reels (swipeable viewer), recaps (list + article/video
  detail), categories, search, watchlist, history, profile, settings,
  downloads, about/contact/help/privacy/terms/copyright.
- **Admin dashboard**: role-gated (`moderator`+, `admin` for settings/user
  roles), with a dashboard, and management pages for every content type.
  **Movies has the full reference CRUD pattern** (list → create → edit →
  archive, with Zod validation and audit logging) at
  `src/app/admin/movies/**` + `src/app/api/movies/**` — replicate this exact
  shape for series/episodes/reels/recaps if you need full custom forms for
  those too (the list + publish/moderate actions for those are already built).
- **Authorized downloads**: signed, expiring URLs issued server-side via the
  service-role client, access-logged, rate-limited
  (`src/app/api/downloads/[id]/authorize/route.ts`).
- **Video player**: full control surface (play/pause/volume/seek/speed/
  fullscreen/subtitles/resume), fetching a server-authorized playback URL
  rather than embedding raw source URLs.
- **SEO/accessibility**: dynamic metadata, sitemap.xml, robots.txt, semantic
  HTML, focus states, alt text on images.
- **Security**: CSP + security headers, RLS everywhere, honeypot on contact
  form, sanitized HTML rendering for recap articles, server-only service-role
  client.

### What's intentionally a lighter stub (documented inline where it lives)
- **Series/episodes/reels/recaps/categories admin forms**: list views and
  moderation actions (approve/reject/publish) are real and functional; the
  rich create/edit *forms* only exist for Movies as the reference pattern.
  Copy `MovieForm.tsx` → `SeriesForm.tsx` etc. following the same shape.
- **Actual video transcoding/CDN delivery**: not implemented — see
  `docs/VIDEO_HOSTING.md`. The scaffold defines exactly where a real provider
  (Mux, Cloudflare Stream, etc.) plugs in.
- **File uploads**: admin forms currently take poster/backdrop as URLs, not
  file inputs. Wiring direct-to-Supabase-Storage uploads is straightforward
  but not included.
- **Notification delivery**: the `notifications` table + RLS exist; nothing
  actually sends a push/email yet — that's a Supabase Edge Function or
  third-party job you'd add.
- **Analytics**: `admin/analytics` reads real data but `view_count` is never
  incremented anywhere yet — wire that into `/api/playback`.
- **Tests**: two real Vitest files (pure functions + validation schemas).
  RLS/auth/admin-permission integration tests are documented but not written
  — see `tests/README.md` for exactly how to add them against a local
  Supabase instance.

### Becoming the first admin
No UI path can create the first admin (correctly — that's not something a
client request should ever be able to do). After signing up normally, run
this once in the Supabase SQL editor:
```sql
update profiles set role = 'super_admin' where user_id = '<your-auth-user-id>';
```

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
# apply supabase/migrations/*.sql to your project (see docs/DEPLOYMENT.md)
npm run dev
```

## Project structure
```
supabase/migrations/    SQL schema + RLS policies, in order
src/app/                Next.js App Router routes (public, auth, admin, api)
src/components/         layout / home / player / admin / auth / ui components
src/lib/                supabase clients, auth helpers, types, validation, utils
docs/                   deployment guide, security checklist, video hosting notes
tests/                  Vitest specs (see tests/README.md for what's covered)
```

## Further reading
- `docs/DEPLOYMENT.md` — full deploy walkthrough
- `docs/SECURITY_CHECKLIST.md` — what's covered, what's left
- `docs/VIDEO_HOSTING.md` — how to plug in a real video/CDN provider
- `supabase/README.md` — how RLS and roles work in this schema
