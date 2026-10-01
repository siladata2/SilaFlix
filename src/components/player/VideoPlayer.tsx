'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  RotateCcw,
  RotateCw,
  Download,
  Settings,
  Subtitles,
  ExternalLink,
} from 'lucide-react';
import type { Movie, Series, Episode } from '@/lib/types/database';
import { resolvePlaybackSource } from '@/lib/videoUtils';
import Hls from 'hls.js';

export interface VideoQualityOption {
  quality: string;
  url: string;
}

export interface SubtitleOption {
  label: string;
  lang: string;
  url: string;
}

export interface VideoPlayerProps {
  src?: string;
  title?: string;
  poster?: string;
  item?: Movie | Series;
  activeEpisode?: Episode;
  qualities?: VideoQualityOption[];
  subtitles?: SubtitleOption[];
  downloadUrl?: string;
  downloadEnabled?: boolean;
  onClose?: () => void;
  onNextEpisode?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  poster,
  item,
  activeEpisode,
  qualities = [],
  subtitles = [],
  downloadUrl,
  downloadEnabled = false,
  onClose,
  onNextEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [activeQuality, setActiveQuality] = useState<string>('Auto');
  const [isHlsBuffering, setIsHlsBuffering] = useState(false);

  const displayTitle =
    title ||
    activeEpisode?.title ||
    item?.title ||
    'Playback';

  const initialSource =
    src ||
    activeEpisode?.video_url ||
    (item as any)?.video_url ||
    (item as any)?.stream_url ||
    '';

  const posterSource =
    poster ||
    activeEpisode?.thumbnail_url ||
    item?.backdrop_url ||
    item?.poster_url ||
    '';

  const parsed = resolvePlaybackSource(currentSrc || initialSource);

  useEffect(() => {
    setCurrentSrc(initialSource);
  }, [initialSource]);

  // HLS stream setup
  useEffect(() => {
    const video = videoRef.current;
    const effectiveUrl = parsed.streamUrl;
    if (!video || !effectiveUrl) return;

    if (parsed.isEmbed) {
      return; // Handled by iframe
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls =
      parsed.type === 'hls' ||
      effectiveUrl.includes('.m3u8') ||
      effectiveUrl.includes('/api/stream-proxy');

    if (isHls && Hls.isSupported()) {
      let triedProxyFallback = effectiveUrl.startsWith('/api/stream-proxy');

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(effectiveUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsHlsBuffering(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        setIsHlsBuffering(true);
      });
      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setIsHlsBuffering(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (!triedProxyFallback && parsed.proxyUrl) {
                triedProxyFallback = true;
                hls.loadSource(parsed.proxyUrl);
                hls.startLoad();
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = effectiveUrl;
      video.load();
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSrc, parsed.isEmbed, parsed.type, parsed.streamUrl, parsed.proxyUrl]);

  // Auto hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3500);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 100000, videoRef.current.currentTime + seconds)
      );
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const switchQuality = (qLabel: string, qUrl: string) => {
    const prevTime = videoRef.current?.currentTime || 0;
    setActiveQuality(qLabel);
    setCurrentSrc(qUrl);
    setShowQualityMenu(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = prevTime;
      }
    }, 200);
  };

  const canDownload = Boolean(downloadEnabled && (downloadUrl || parsed.downloadUrl));
  const effectiveDownloadUrl = downloadUrl || parsed.downloadUrl || '';

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
    >
      {/* Top Header Bar */}
      <div
        className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
              aria-label="Close player"
            >
              <X size={20} />
            </button>
          )}
          <div>
            <h2 className="text-white font-semibold text-sm sm:text-base drop-shadow">
              {displayTitle}
            </h2>
            {activeQuality !== 'Auto' && (
              <div className="flex items-center gap-2 text-[11px] text-ink-faint">
                <span>{activeQuality}</span>
              </div>
            )}
          </div>
        </div>

        {/* Top actions: Download only (no external link exposure) */}
        <div className="flex items-center gap-3">
          {canDownload && (
            <a
              href={effectiveDownloadUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-[#171412] text-xs font-semibold hover:bg-gold/90 transition-colors"
            >
              <Download size={14} /> Download
            </a>
          )}
        </div>
      </div>

      {/* Embedded player (YouTube / Google Drive preview) */}
      {parsed.isEmbed ? (
        <div className="w-full h-full flex items-center justify-center pt-14 pb-10">
          <iframe
            src={parsed.embedUrl || parsed.streamUrl}
            title={displayTitle}
            className="w-full h-full max-w-6xl max-h-[85vh] border-0 rounded-lg shadow-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : initialSource ? (
        /* Native / HLS HTML5 Video element */
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            poster={posterSource || undefined}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          >
            {subtitles.map((sub, i) => (
              <track
                key={i}
                kind="subtitles"
                label={sub.label}
                srcLang={sub.lang}
                src={sub.url}
                default={i === 0}
              />
            ))}
          </video>

          {isHlsBuffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8">
          <p className="text-ink-dim text-sm mb-4">No video stream available for this title.</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gold text-[#171412] font-semibold rounded-lg text-xs"
            >
              Back
            </button>
          )}
        </div>
      )}

      {/* Bottom Controls Bar (for direct/HLS streams) */}
      {!parsed.isEmbed && initialSource && (
        <div
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress bar */}
          <div className="relative mb-3 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-gold focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-white text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>

              <button
                onClick={() => skip(-10)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors hidden sm:block"
                title="Rewind 10s"
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={() => skip(10)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors hidden sm:block"
                title="Forward 10s"
              >
                <RotateCw size={16} />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-gold hidden sm:block"
                />
              </div>

              {/* Time display */}
              <span className="text-[11px] sm:text-xs text-white/80 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3 relative">
              {/* Quality selector */}
              {qualities.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-white/10 text-xs font-semibold text-gold"
                    title="Change Quality"
                  >
                    <Settings size={16} />
                    <span className="hidden sm:inline">{activeQuality}</span>
                  </button>

                  {showQualityMenu && (
                    <div className="absolute right-0 bottom-full mb-2 bg-[#1f1b18] border border-line rounded-lg shadow-xl p-1.5 z-30 min-w-[120px]">
                      <p className="text-[10px] text-ink-faint px-2 py-1 uppercase font-semibold">Video Quality</p>
                      <button
                        onClick={() => switchQuality('Auto', initialSource)}
                        className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-gold/10 ${
                          activeQuality === 'Auto' ? 'text-gold font-bold' : 'text-white'
                        }`}
                      >
                        Auto (Default)
                      </button>
                      {qualities.map((q) => (
                        <button
                          key={q.quality}
                          onClick={() => switchQuality(q.quality, q.url)}
                          className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-gold/10 ${
                            activeQuality === q.quality ? 'text-gold font-bold' : 'text-white'
                          }`}
                        >
                          {q.quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtitles indication */}
              {subtitles.length > 0 && (
                <div className="text-white/80 p-1" title={`${subtitles.length} Subtitles Available`}>
                  <Subtitles size={16} />
                </div>
              )}

              {/* Next Episode button */}
              {onNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold"
                >
                  Next Ep
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
