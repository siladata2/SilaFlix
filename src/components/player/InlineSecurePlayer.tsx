'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Download,
  RefreshCw,
  Wrench,
  PowerOff,
  Lock,
  Layers,
  Unlock,
  Gauge,
  Monitor,
} from 'lucide-react';
import { resolvePlaybackSource } from '@/lib/videoUtils';

export interface SecureStreamFeed {
  label: string;
  tokenOrUrl: string;
}

interface InlineSecurePlayerProps {
  title: string;
  poster?: string;
  primaryTokenOrUrl: string;
  feeds?: SecureStreamFeed[];
  downloadToken?: string;
  allowDownload?: boolean;
  isLive?: boolean;
  status?: string; // 'published' | 'maintenance' | 'offline' | 'paid' | 'draft'
  isPaid?: boolean;
  priceLabel?: string;
  supportPhone?: string;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export function InlineSecurePlayer({
  title,
  poster,
  primaryTokenOrUrl,
  feeds = [],
  downloadToken,
  allowDownload = false,
  isLive = false,
  status = 'published',
  isPaid = false,
  priceLabel = 'VIP Pass',
  supportPhone = '+255789661031',
}: InlineSecurePlayerProps) {
  const allFeeds: SecureStreamFeed[] = useMemo(() => {
    const base: SecureStreamFeed[] = [
      { label: isLive ? 'Server 1 (Live HD)' : 'Server 1 (HD)', tokenOrUrl: primaryTokenOrUrl },
    ];
    feeds.forEach((f, idx) => {
      if (f.tokenOrUrl && f.tokenOrUrl !== primaryTokenOrUrl) {
        base.push({
          label: f.label || `Server ${idx + 2}`,
          tokenOrUrl: f.tokenOrUrl,
        });
      }
    });
    return base;
  }, [primaryTokenOrUrl, feeds, isLive]);

  const [activeFeedIdx, setActiveFeedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekOffset, setSeekOffset] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isNativeGDriveMp4, setIsNativeGDriveMp4] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [unlockedVip, setUnlockedVip] = useState(false);
  const [vipCodeInput, setVipCodeInput] = useState('');
  const [vipError, setVipError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const activeFeed = allFeeds[activeFeedIdx] || allFeeds[0];
  const parsed = useMemo(
    () => resolvePlaybackSource(activeFeed?.tokenOrUrl || ''),
    [activeFeed]
  );

  // Reset seek offset when switching feeds
  useEffect(() => {
    setSeekOffset(0);
    setCurrentTime(0);
    setDuration(0);
  }, [activeFeedIdx, parsed.streamUrl]);

  // Probe total duration & container format for Google Drive streams
  useEffect(() => {
    if (parsed.type !== 'gdrive' || !parsed.streamUrl) return;
    let cancelled = false;
    const sep = parsed.streamUrl.includes('?') ? '&' : '?';
    fetch(`${parsed.streamUrl}${sep}meta=1`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data) {
          if (typeof data.isNativeMp4 === 'boolean') {
            setIsNativeGDriveMp4(data.isNativeMp4);
          }
          if (data.duration && data.duration > 0) {
            setDuration((prev) => (prev > 0 ? prev : data.duration));
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [parsed.type, parsed.streamUrl]);

  // Auto-hide controls during playback when mouse is idle
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3200);
    };
    const el = wrapperRef.current;
    if (el) {
      el.addEventListener('mousemove', handleMove);
      el.addEventListener('touchstart', handleMove, { passive: true });
    }
    return () => {
      clearTimeout(timer);
      if (el) {
        el.removeEventListener('mousemove', handleMove);
        el.removeEventListener('touchstart', handleMove);
      }
    };
  }, [isPlaying]);

  const effectiveDownloadHref = useMemo(() => {
    if (isLive || !allowDownload) return '';
    if (downloadToken) {
      return `/api/downloads/direct?token=${encodeURIComponent(downloadToken)}&title=${encodeURIComponent(title)}`;
    }
    if (parsed.downloadUrl) {
      const sep = parsed.downloadUrl.includes('?') ? '&' : '?';
      return `${parsed.downloadUrl}${sep}title=${encodeURIComponent(title)}`;
    }
    return '';
  }, [isLive, allowDownload, downloadToken, parsed.downloadUrl, title]);

  const isMaintenance = status === 'maintenance';
  const isOffline = status === 'offline' || status === 'draft';
  const requiresVipGate = (isPaid || status === 'paid') && !unlockedVip;

  const effectiveStreamSrc = useMemo(() => {
    if (!parsed.streamUrl) return '';
    if (parsed.type === 'gdrive' && seekOffset > 0) {
      const sep = parsed.streamUrl.includes('?') ? '&' : '?';
      return `${parsed.streamUrl}${sep}start=${Math.floor(seekOffset)}`;
    }
    return parsed.streamUrl;
  }, [parsed.streamUrl, parsed.type, seekOffset]);

  useEffect(() => {
    if (isMaintenance || isOffline || requiresVipGate) return;
    const video = videoRef.current;
    if (!video || !effectiveStreamSrc || parsed.isEmbed) return;

    setStreamError(null);
    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls =
      parsed.type === 'hls' ||
      effectiveStreamSrc.includes('.m3u8') ||
      effectiveStreamSrc.includes('/api/stream-proxy');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(effectiveStreamSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        video.playbackRate = playbackRate;
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              setIsBuffering(false);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setIsBuffering(false);
              setStreamError('Playback interrupted. Click Reconnect or switch server below.');
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = effectiveStreamSrc;
      video.load();
      video.playbackRate = playbackRate;
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch(() => {
          setIsBuffering(false);
        });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveStreamSrc, parsed.isEmbed, parsed.type, isMaintenance, isOffline, requiresVipGate]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const seekToSeconds = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(duration || 100000, targetSec));
    setCurrentTime(clamped);
    if (parsed.type === 'gdrive' && !isNativeGDriveMp4) {
      setSeekOffset(clamped);
    } else if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekToSeconds(time);
  };

  const skip = (secs: number) => {
    seekToSeconds(currentTime + secs);
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleReconnect = () => {
    setStreamError(null);
    if (hlsRef.current && effectiveStreamSrc) {
      setIsBuffering(true);
      hlsRef.current.loadSource(effectiveStreamSrc);
      hlsRef.current.startLoad();
    } else if (videoRef.current) {
      setIsBuffering(true);
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch(() => setIsBuffering(false));
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipCodeInput.trim()) {
      setVipError('Please enter your VIP access code or payment reference.');
      return;
    }
    setVipError(null);
    setUnlockedVip(true);
  };

  return (
    <div className="space-y-3" onContextMenu={(e) => e.preventDefault()}>
      {/* Main Video Container */}
      <div
        ref={wrapperRef}
        className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-line shadow-2xl select-none group"
      >
        {/* 1. MAINTENANCE STATE */}
        {isMaintenance ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0a09] p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
              <Wrench size={28} />
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-1">
              Scheduled Maintenance
            </h3>
            <p className="text-xs sm:text-sm text-ink-dim max-w-md">
              {title} is currently undergoing scheduled maintenance for quality upgrades. Please check back shortly.
            </p>
          </div>
        ) : isOffline ? (
          /* 2. OFFLINE STATE */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0a09] p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
              <PowerOff size={28} />
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-1">
              Currently Unavailable
            </h3>
            <p className="text-xs sm:text-sm text-ink-dim max-w-md">
              {title} is temporarily offline. Explore more titles and live channels below.
            </p>
          </div>
        ) : requiresVipGate ? (
          /* 3. PAID / VIP ACCESS GATE */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#14110f] to-[#080706] p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/40 text-gold flex items-center justify-center mb-3">
              <Lock size={26} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1">
              SilaFlix VIP Access
            </span>
            <h3 className="text-lg sm:text-2xl font-display font-bold text-white mb-1">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-ink-dim max-w-md mb-4">
              This is a premium {isLive ? 'live channel' : 'title'} ({priceLabel}). Complete payment via{' '}
              <strong className="text-white">{supportPhone}</strong> and enter your access code below to unlock instant playback.
            </p>

            <form
              onSubmit={handleUnlockSubmit}
              className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-sm"
            >
              <input
                type="text"
                value={vipCodeInput}
                onChange={(e) => setVipCodeInput(e.target.value)}
                placeholder="Enter VIP Code or Payment Reference..."
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center gap-1.5 bg-gold text-[#171412] font-bold px-4 py-2 rounded-lg text-xs hover:bg-[#f0b25a] transition-colors"
              >
                <Unlock size={14} /> Unlock Now
              </button>
            </form>
            {vipError && <p className="text-xs text-red-400 mt-2">{vipError}</p>}
          </div>
        ) : parsed.isEmbed ? (
          /* 4. EMBEDDED STREAM (YouTube Live) */
          <div className="relative w-full h-full">
            <iframe
              src={parsed.embedUrl || parsed.streamUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute top-0 right-0 w-16 h-14 z-10 bg-transparent" />
          </div>
        ) : (
          /* 5. CUSTOM HTML5 CINEMA & LIVE VIDEO PLAYER (HLS, MP4 & Google Drive Streams) */
          <>
            <video
              ref={videoRef}
              poster={poster || undefined}
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(seekOffset + videoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  const vidDur = videoRef.current.duration;
                  if (vidDur && isFinite(vidDur) && vidDur > 0) {
                    setDuration(vidDur);
                  }
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              className={`w-full h-full cursor-pointer ${
                videoFit === 'cover' ? 'object-cover' : 'object-contain'
              }`}
              playsInline
            />

            {/* Center Play Button Overlay when paused */}
            {!isPlaying && !isBuffering && !streamError && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Play video"
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                  <Play size={28} fill="currentColor" className="ml-1" />
                </div>
              </button>
            )}

            {/* Buffering Spinner */}
            {isBuffering && !streamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 pointer-events-none gap-2.5">
                <div className="w-11 h-11 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-white/90">Loading {title}...</span>
              </div>
            )}

            {/* Stream Error Overlay */}
            {streamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
                <p className="text-sm font-semibold text-white mb-1">{title}</p>
                <p className="text-xs text-ink-dim max-w-md mb-4">{streamError}</p>
                <button
                  onClick={handleReconnect}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e50914] text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  <RefreshCw size={14} /> Reconnect
                </button>
              </div>
            )}

            {/* Top Overlay Title Bar */}
            <div
              className={`absolute top-0 inset-x-0 p-3.5 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#e50914] text-white text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                )}
                <span className="text-xs sm:text-sm font-semibold text-white drop-shadow truncate max-w-md">
                  {title}
                </span>
              </div>
            </div>

            {/* Bottom Custom Player Control Bar */}
            <div
              className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 sm:p-4 space-y-2.5 transition-opacity duration-300 ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Timeline Seek Bar (for Movies & On-Demand Videos) */}
              {!isLive && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={duration > 0 && isFinite(duration) ? duration : Math.max(currentTime + 60, 3600)}
                    step={1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-[#e50914]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2 text-white text-xs">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Play / Pause */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-white/15 hover:bg-[#e50914] transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                  </button>

                  {/* -10s / +10s Skip Buttons */}
                  {!isLive && (
                    <>
                      <button
                        type="button"
                        onClick={() => skip(-10)}
                        className="p-1.5 rounded-lg hover:bg-white/15 transition-colors inline-flex items-center gap-0.5"
                        title="Rewind 10 seconds"
                      >
                        <RotateCcw size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => skip(10)}
                        className="p-1.5 rounded-lg hover:bg-white/15 transition-colors inline-flex items-center gap-0.5"
                        title="Forward 10 seconds"
                      >
                        <RotateCw size={15} />
                      </button>
                    </>
                  )}

                  {/* Volume Control */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-14 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#e50914] hidden sm:block"
                    />
                  </div>

                  {/* Time Counter or Live Badge */}
                  {isLive ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>LIVE TV</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-white/85 tabular-nums font-medium">
                      {formatTime(currentTime)}
                      {duration > 0 && isFinite(duration) ? ` / ${formatTime(duration)}` : ''}
                    </span>
                  )}
                </div>

                {/* Right-side Controls: Speed, Aspect Fit, Reload, Fullscreen */}
                <div className="flex items-center gap-1.5 sm:gap-2 relative">
                  {!isLive && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSpeedMenu((v) => !v)}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[11px] font-semibold inline-flex items-center gap-1"
                        title="Playback Speed"
                      >
                        <Gauge size={13} />
                        <span>{playbackRate}x</span>
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute right-0 bottom-full mb-2 bg-[#181512] border border-line rounded-xl shadow-xl p-1 z-30 min-w-[84px]">
                          {SPEED_OPTIONS.map((spd) => (
                            <button
                              key={spd}
                              type="button"
                              onClick={() => changeSpeed(spd)}
                              className={`w-full text-left px-2.5 py-1 rounded-lg text-xs transition-colors ${
                                playbackRate === spd
                                  ? 'bg-[#e50914] text-white font-bold'
                                  : 'text-white/80 hover:bg-white/10'
                              }`}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setVideoFit((f) => (f === 'contain' ? 'cover' : 'contain'))}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors hidden sm:inline-flex"
                    title={videoFit === 'contain' ? 'Fill Screen' : 'Fit Screen'}
                  >
                    <Monitor size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={handleReconnect}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Reload Stream"
                  >
                    <RefreshCw size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="Fullscreen"
                    title="Fullscreen"
                  >
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Bar: Server Switcher (when multiple servers exist) */}
      {allFeeds.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-bg-card border border-line rounded-xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-faint flex items-center gap-1.5 font-medium">
              <Layers size={14} className="text-[#e50914]" />
              Server:
            </span>
            {allFeeds.map((feed, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveFeedIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeFeedIdx === idx
                    ? 'bg-[#e50914] text-white shadow-sm'
                    : 'bg-bg border border-line text-ink-dim hover:text-white'
                }`}
              >
                {feed.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
