'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Bookmark,
  Share2,
  Flag,
  Volume2,
  VolumeX,
  Download,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Play,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toaster';
import type { Reel } from '@/lib/types/database';
import { parseYouTubeUrl, parseGoogleDriveUrl, encodeStreamToken } from '@/lib/videoUtils';

function resolveReelVideoSrc(rawUrl: string): { isYouTube: boolean; embedUrl?: string; videoSrc: string } {
  const yt = parseYouTubeUrl(rawUrl);
  if (yt) {
    return { isYouTube: true, embedUrl: yt.embedUrl, videoSrc: yt.embedUrl };
  }
  const gdrive = parseGoogleDriveUrl(rawUrl);
  if (gdrive) {
    const token = encodeStreamToken(rawUrl);
    return {
      isYouTube: false,
      videoSrc: `/api/gdrive-stream?token=${encodeURIComponent(token)}`,
    };
  }
  return { isYouTube: false, videoSrc: rawUrl };
}

export function ReelsViewer({
  reels,
  startIndex = 0,
}: {
  reels: Reel[];
  startIndex?: number;
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [muted, setMuted] = useState(false);
  const [pausedMap, setPausedMap] = useState<Record<string, boolean>>({});
  const [downloadLinks, setDownloadLinks] = useState<Record<string, string | null>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const toast = useToast();

  // Scroll to initial startIndex on mount
  useEffect(() => {
    if (startIndex > 0 && slideRefs.current[startIndex]) {
      slideRefs.current[startIndex]?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }
  }, [startIndex]);

  // Observe which vertical slide is snapped into view (TikTok-style)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index || '0');
            setActiveIndex(idx);
          }
        });
      },
      {
        root: scroller,
        threshold: [0.6, 0.85],
      }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [reels.length]);

  // Auto-play active slide video & pause inactive ones
  useEffect(() => {
    reels.forEach((r, idx) => {
      const vid = videoRefs.current[r.id];
      if (!vid) return;
      if (idx === activeIndex) {
        vid.muted = muted;
        vid
          .play()
          .then(() => {
            setPausedMap((p) => ({ ...p, [r.id]: false }));
          })
          .catch(() => {
            vid.muted = true;
            setMuted(true);
            vid
              .play()
              .then(() => setPausedMap((p) => ({ ...p, [r.id]: false })))
              .catch(() => {});
          });
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeIndex, reels, muted]);

  // Check if active reel has authorized download
  useEffect(() => {
    const currentReel = reels[activeIndex];
    if (!currentReel?.id) return;
    if (downloadLinks[currentReel.id] !== undefined) return;

    fetch(`/api/playback?type=reel&id=${currentReel.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setDownloadLinks((prev) => ({
          ...prev,
          [currentReel.id]: data?.isDownloadEnabled
            ? data.downloadUrl || currentReel.video_url
            : null,
        }));
      })
      .catch(() => {
        setDownloadLinks((prev) => ({ ...prev, [currentReel.id]: null }));
      });
  }, [activeIndex, reels, downloadLinks]);

  function scrollToIndex(targetIdx: number) {
    const clamped = Math.min(Math.max(targetIdx, 0), reels.length - 1);
    const node = slideRefs.current[clamped];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Keyboard up/down navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, reels.length]);

  function toggleVideoPlay(reelId: string) {
    const vid = videoRefs.current[reelId];
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setPausedMap((p) => ({ ...p, [reelId]: false }));
    } else {
      vid.pause();
      setPausedMap((p) => ({ ...p, [reelId]: true }));
    }
  }

  function like(reelItem: Reel) {
    toast('Liked ❤️');
    fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'reel', content_id: reelItem.id }),
    }).catch(() => {});
  }

  function save(reelItem: Reel) {
    toast('Saved to collection');
    fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'reel', content_id: reelItem.id }),
    }).catch(() => {});
  }

  function report(reelItem: Reel) {
    toast('Thanks — our moderation team will review this');
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_type: 'reel',
        content_id: reelItem.id,
        reason: 'user_reported',
      }),
    }).catch(() => {});
  }

  async function share(reelItem: Reel) {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/reels?id=${reelItem.id}` : '';
    if (navigator.share) {
      try {
        await navigator.share({ url, title: reelItem.title });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast('Reel link copied');
  }

  return (
    <div className="fixed inset-0 z-40 bg-black select-none">
      {/* Top-left Back Button */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.push('/');
          }
        }}
        className="fixed top-20 left-4 z-50 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-semibold hover:bg-black/80 transition-all shadow-lg"
      >
        <ArrowLeft size={15} />
        <span>Back</span>
      </button>

      {/* TikTok Fullscreen Vertical Snap Scroll Container */}
      <div
        ref={scrollerRef}
        className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
      >
        {reels.map((item, idx) => {
          const media = resolveReelVideoSrc(item.video_url);
          const isActive = idx === activeIndex;
          const isPaused = pausedMap[item.id] === true;
          const downloadSource = downloadLinks[item.id];

          return (
            <div
              key={item.id}
              data-index={idx}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              className="snap-start snap-always h-[100dvh] w-full flex items-center justify-center pt-0 md:pt-14 pb-16 md:pb-4 relative"
            >
              <div className="relative h-full md:h-[88vh] aspect-[9/16] w-full max-w-[460px] bg-black rounded-none md:rounded-2xl overflow-hidden shadow-2xl border border-line/30">
                {media.isYouTube ? (
                  <div className="w-full h-full relative">
                    {isActive ? (
                      <iframe
                        src={media.embedUrl}
                        title={item.title}
                        className="w-full h-full border-0 pointer-events-auto"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        {item.thumbnail_url && (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover opacity-60"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <video
                      ref={(el) => {
                        videoRefs.current[item.id] = el;
                      }}
                      src={media.videoSrc}
                      poster={item.thumbnail_url ?? undefined}
                      className="w-full h-full object-cover cursor-pointer"
                      loop
                      muted={muted}
                      playsInline
                      preload="metadata"
                      onClick={() => toggleVideoPlay(item.id)}
                    />
                    {isPaused && (
                      <button
                        type="button"
                        onClick={() => toggleVideoPlay(item.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/25"
                      >
                        <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center">
                          <Play size={28} fill="currentColor" className="ml-1" />
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Bottom Caption Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 pr-16 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none">
                  <p className="text-white font-bold text-sm sm:text-base mb-1 drop-shadow">
                    {item.title}
                  </p>
                  {(item.description || (item as any).caption) && (
                    <p className="text-white/85 text-xs sm:text-sm line-clamp-3 drop-shadow">
                      {item.description || (item as any).caption}
                    </p>
                  )}
                </div>

                {/* TikTok Right Action Rail */}
                <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
                  <button
                    type="button"
                    onClick={() => like(item)}
                    aria-label="Like"
                    className="p-3 rounded-full bg-black/55 backdrop-blur-md text-white hover:text-red-400 transition-colors flex flex-col items-center"
                  >
                    <Heart size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={() => save(item)}
                    aria-label="Save"
                    className="p-3 rounded-full bg-black/55 backdrop-blur-md text-white hover:text-gold transition-colors flex flex-col items-center"
                  >
                    <Bookmark size={20} />
                  </button>

                  {downloadSource && (
                    <a
                      href={downloadSource}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-black/55 backdrop-blur-md text-white hover:text-gold transition-colors flex flex-col items-center shadow-lg"
                      title="Download Reel"
                    >
                      <Download size={19} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => share(item)}
                    aria-label="Share"
                    className="p-3 rounded-full bg-black/55 backdrop-blur-md text-white hover:text-gold transition-colors flex flex-col items-center"
                  >
                    <Share2 size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => report(item)}
                    aria-label="Report"
                    className="p-3 rounded-full bg-black/55 backdrop-blur-md text-white/70 hover:text-white transition-colors flex flex-col items-center"
                  >
                    <Flag size={18} />
                  </button>

                  {!media.isYouTube && (
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                      className="p-3 rounded-full bg-black/55 backdrop-blur-md text-white transition-colors"
                    >
                      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Up / Down Slide Arrows */}
      <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-50">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="p-3 rounded-full bg-bg-card/85 border border-line text-white hover:text-gold disabled:opacity-25 transition-all"
          title="Previous Reel"
        >
          <ChevronUp size={22} />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === reels.length - 1}
          className="p-3 rounded-full bg-bg-card/85 border border-line text-white hover:text-gold disabled:opacity-25 transition-all"
          title="Next Reel"
        >
          <ChevronDown size={22} />
        </button>
      </div>
    </div>
  );
}
