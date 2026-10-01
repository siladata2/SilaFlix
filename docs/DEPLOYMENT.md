# Deployment guide

## 1. Create the Supabase project
1. Create a project at supabase.com.
2. Copy the Project URL and anon key into `.env.local` (see `.env.example`).
3. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY` — **server env
   only**, never commit it, never prefix it `NEXT_PUBLIC_`.

## 2. Run migrations
```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```
This runs every file in `supabase/migrations/` in order, including RLS
policies. Do **not** run `0011_seed_data.sql` against production — it's
local/dev sample data only.

## 3. Storage buckets
In the Supabase dashboard, create:
- `posters` — public read
- `backdrops` — public read
- `thumbnails` — public read
- `avatars` — public read, user-scoped write (via RLS storage policy)
- `protected-downloads` — **private**. This is what `protected_file_reference`
  in `download_options` points into. The signed-URL flow in
  `src/app/api/downloads/[id]/authorize/route.ts` is the only path that reads it.

## 4. Video hosting for large files
Supabase Storage is fine for posters/thumbnails but not built for
adaptive-bitrate video streaming at scale. Section 7/18 of the original spec
calls for a dedicated provider (Mux, Cloudflare Stream, Bunny Stream, or
similar). Wire this into:
- `movie_sources` / `episode_sources` tables (already migrated) — store the
  provider + external asset ID, not the video itself.
- `src/app/api/playback/route.ts` — replace the placeholder URL construction
  with a real signed-playback-URL call to your provider's API using
  `VIDEO_PROVIDER_API_KEY` / `VIDEO_PROVIDER_BASE_URL`.

## 5. Local development
```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

## 6. Production build
```bash
npm run build
npm run start
```
Deploy to Vercel, or any Node-capable host. Set the same env vars from
`.env.example` in your hosting provider's dashboard — **never** commit
`.env.local`.

## 7. Post-deploy checklist
- [ ] Confirm RLS is enabled on every table (`supabase db push` applies it,
      but verify in the dashboard's Table Editor → each table → RLS toggle)
- [ ] Confirm the service-role key is only referenced from `lib/supabase/admin.ts`
      and files under `src/app/api/**`
- [ ] Set `app_settings.support_phone` / `support_email` to real values
- [ ] Promote your own account to `admin` directly in the `profiles` table
      (the very first admin has to be granted manually — every UI path
      requires an existing admin)
- [ ] Run `npm run test` and address failures
- [ ] Load-test the `/api/downloads/[id]/authorize` rate limit for your
      expected traffic and adjust the 20/hour default in that route if needed
