# Video hosting note

This scaffold intentionally does NOT implement actual video transcoding,
adaptive bitrate streaming, or DRM — that's a dedicated video/CDN provider's
job (Mux, Cloudflare Stream, Bunny Stream, AWS MediaConvert + CloudFront,
etc.), per section 7 of the original spec: "For large video files, integrate
a dedicated authorized video hosting and CDN provider instead of relying
only on Supabase Storage."

What's here instead:
- `movie_sources` / `episode_sources` tables to store a `provider` +
  `external_id` reference per title
- `src/app/api/playback/route.ts` as the single choke point where you'd call
  your provider's API to mint a signed, time-limited playback URL
- `src/components/player/VideoPlayer.tsx` as a plain `<video>` wrapper with
  the control surface the spec asks for (play/pause, volume, fullscreen,
  seek, speed, subtitles, resume, next episode via `onEnded`)

To go from here to real streaming:
1. Pick a provider and get API credentials.
2. Fill in `VIDEO_PROVIDER_API_KEY` / `VIDEO_PROVIDER_BASE_URL` in `.env.local`.
3. Replace the placeholder URL construction in `/api/playback/route.ts` with
   a real call to that provider's signed-URL endpoint.
4. If your provider serves HLS (`.m3u8`), add `hls.js` and branch
   `VideoPlayer.tsx` to use it for non-Safari browsers (Safari plays HLS
   natively via `<video>`).
