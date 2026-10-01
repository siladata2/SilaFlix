'use client';

import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Check, Loader2, Video as VideoIcon, Download, FileVideo } from 'lucide-react';
import { detectVideoType, parseGoogleDriveUrl } from '@/lib/videoUtils';

export interface VideoQualityOption {
  quality: '360p' | '480p' | '720p' | '1080p' | '4K';
  url: string;
}

export interface SubtitleOption {
  label: string;
  lang: string;
  url: string;
}

interface VideoSourceInputProps {
  label?: string;
  videoUrl: string;
  onChangeVideoUrl: (url: string) => void;
  // Separate download URL
  downloadUrl?: string;
  onChangeDownloadUrl?: (url: string) => void;
  downloadEnabled?: boolean;
  onChangeDownloadEnabled?: (enabled: boolean) => void;
  // Qualities
  qualities?: VideoQualityOption[];
  onChangeQualities?: (qualities: VideoQualityOption[]) => void;
  // Subtitles
  subtitles?: SubtitleOption[];
  onChangeSubtitles?: (subs: SubtitleOption[]) => void;
  // Options
  showQualities?: boolean;
  showSubtitles?: boolean;
  folder?: string;
}

export function VideoSourceInput({
  label = 'Primary Video Stream',
  videoUrl,
  onChangeVideoUrl,
  downloadUrl = '',
  onChangeDownloadUrl,
  downloadEnabled = false,
  onChangeDownloadEnabled,
  qualities = [],
  onChangeQualities,
  subtitles = [],
  onChangeSubtitles,
  showQualities = true,
  showSubtitles = true,
  folder = 'videos',
}: VideoSourceInputProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Quality input state
  const [newQuality, setNewQuality] = useState<'360p' | '480p' | '720p' | '1080p' | '4K'>('1080p');
  const [newQualityUrl, setNewQualityUrl] = useState('');

  // New Subtitle state
  const [newSubLang, setNewSubLang] = useState('English');
  const [newSubCode, setNewSubCode] = useState('en');
  const [newSubUrl, setNewSubUrl] = useState('');

  const detected = detectVideoType(videoUrl);
  const gdrive = parseGoogleDriveUrl(videoUrl);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(`Uploading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Video upload failed');
      }

      onChangeVideoUrl(data.url);
      // Auto-set download URL if none provided
      if (onChangeDownloadUrl && !downloadUrl) {
        onChangeDownloadUrl(data.url);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Video upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleAutoDetectGdrive() {
    if (gdrive && onChangeDownloadUrl && !downloadUrl) {
      onChangeDownloadUrl(gdrive.downloadUrl);
    }
  }

  function addQuality() {
    if (!newQualityUrl.trim() || !onChangeQualities) return;
    onChangeQualities([
      ...qualities.filter((q) => q.quality !== newQuality),
      { quality: newQuality, url: newQualityUrl.trim() },
    ]);
    setNewQualityUrl('');
  }

  function removeQuality(qVal: string) {
    if (!onChangeQualities) return;
    onChangeQualities(qualities.filter((q) => q.quality !== qVal));
  }

  function addSubtitle() {
    if (!newSubUrl.trim() || !onChangeSubtitles) return;
    onChangeSubtitles([
      ...subtitles,
      { label: newSubLang, lang: newSubCode, url: newSubUrl.trim() },
    ]);
    setNewSubUrl('');
  }

  function removeSubtitle(idx: number) {
    if (!onChangeSubtitles) return;
    onChangeSubtitles(subtitles.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4 bg-bg/40 border border-line p-4 rounded-xl">
      {/* Header with URL vs Upload toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-xs text-ink-dim font-medium">
          {label}
        </label>
        <div className="flex items-center bg-bg border border-line rounded-md p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              mode === 'url' ? 'bg-gold text-[#171412] font-semibold' : 'text-ink-faint hover:text-ink'
            }`}
          >
            <LinkIcon size={12} /> External URL / Link
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              mode === 'upload' ? 'bg-gold text-[#171412] font-semibold' : 'text-ink-faint hover:text-ink'
            }`}
          >
            <Upload size={12} /> Upload Video File
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div className="space-y-2">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => onChangeVideoUrl(e.target.value)}
            placeholder="Paste MP4, M3U8, MPD, Google Drive, or video link..."
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
            <span>Supported:</span>
            <span className="bg-bg border border-line px-1.5 py-0.5 rounded text-gold">.m3u8 (HLS)</span>
            <span className="bg-bg border border-line px-1.5 py-0.5 rounded text-gold">.mp4</span>
            <span className="bg-bg border border-line px-1.5 py-0.5 rounded text-gold">.mpd (DASH)</span>
            <span className="bg-bg border border-line px-1.5 py-0.5 rounded text-gold">Google Drive</span>
            <span className="bg-bg border border-line px-1.5 py-0.5 rounded text-gold">YouTube</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-line hover:border-gold/50 rounded-lg p-5 text-center cursor-pointer transition-colors bg-bg/50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.m3u8,.mpd,.mp4,.webm,.mkv"
              className="hidden"
              onChange={handleFileUpload}
            />
            {uploading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-xs text-ink-dim">
                <Loader2 size={20} className="animate-spin text-gold" />
                <span>{uploadProgress || 'Uploading video to SilaFlix storage...'}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-ink-dim">
                <FileVideo size={24} className="text-gold" />
                <span className="font-medium text-ink">Choose video file to upload</span>
                <span className="text-[11px] text-ink-faint">MP4, WebM, MKV or video files</span>
              </div>
            )}
          </div>
          {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
        </div>
      )}

      {/* Detected format info / Google Drive helper */}
      {videoUrl && (
        <div className="p-2.5 rounded-lg bg-bg border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-green-400 flex items-center gap-1 font-medium">
              <Check size={12} /> Source Active:
            </span>
            <span className="uppercase font-mono bg-bg-card border border-line px-1.5 py-0.5 rounded text-[11px] text-gold">
              {detected}
            </span>
            {gdrive && (
              <span className="text-[11px] text-ink-dim">Google Drive stream detected</span>
            )}
          </div>

          {gdrive && onChangeDownloadUrl && !downloadUrl && (
            <button
              type="button"
              onClick={handleAutoDetectGdrive}
              className="text-xs text-gold underline hover:text-white"
            >
              Auto-fill Google Drive direct download link
            </button>
          )}
        </div>
      )}

      {/* DOWNLOAD SYSTEM SECTION */}
      {onChangeDownloadEnabled && (
        <div className="pt-3 border-t border-line space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={downloadEnabled}
                onChange={(e) => onChangeDownloadEnabled(e.target.checked)}
                className="rounded border-line text-gold focus:ring-gold"
              />
              <Download size={14} className="text-gold" /> Enable Download Option for Users
            </label>
            <span className="text-[11px] text-ink-faint">
              {downloadEnabled ? 'Download button will display to authorized users' : 'Downloads disabled for this title'}
            </span>
          </div>

          {downloadEnabled && onChangeDownloadUrl && (
            <div className="space-y-1.5 pl-5 border-l-2 border-gold/40">
              <label className="block text-xs text-ink-dim font-medium">
                Separate Download URL (Direct MP4, Google Drive, or Authorized CDN)
              </label>
              <input
                type="url"
                value={downloadUrl}
                onChange={(e) => onChangeDownloadUrl(e.target.value)}
                placeholder="https://... (direct download link for users)"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
              />
              <p className="text-[11px] text-ink-faint">
                Keeping streaming URLs and download URLs separate ensures optimal playback & authorized download distribution.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MULTIPLE VIDEO QUALITIES */}
      {showQualities && onChangeQualities && (
        <div className="pt-3 border-t border-line space-y-3">
          <label className="block text-xs font-semibold text-ink">
            Multiple Video Qualities (360p, 480p, 720p, 1080p, 4K)
          </label>

          {qualities.length > 0 && (
            <div className="space-y-1.5">
              {qualities.map((q) => (
                <div key={q.quality} className="flex items-center justify-between bg-bg border border-line rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-semibold text-gold">{q.quality}</span>
                  <span className="text-ink-faint truncate max-w-xs font-mono">{q.url}</span>
                  <button
                    type="button"
                    onClick={() => removeQuality(q.quality)}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={newQuality}
              onChange={(e) => setNewQuality(e.target.value as any)}
              className="bg-bg border border-line rounded-lg px-3 py-1.5 text-xs text-ink"
            >
              <option value="360p">360p</option>
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4K">4K</option>
            </select>
            <input
              type="url"
              value={newQualityUrl}
              onChange={(e) => setNewQualityUrl(e.target.value)}
              placeholder="Stream/file URL for this quality..."
              className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-gold/60"
            />
            <button
              type="button"
              onClick={addQuality}
              className="px-3 py-1.5 bg-bg-card border border-line rounded-lg text-xs font-medium text-ink hover:text-gold"
            >
              + Add Quality
            </button>
          </div>
        </div>
      )}

      {/* SUBTITLES SECTION */}
      {showSubtitles && onChangeSubtitles && (
        <div className="pt-3 border-t border-line space-y-3">
          <label className="block text-xs font-semibold text-ink">
            Subtitles & Closed Captions (.vtt, .srt)
          </label>

          {subtitles.length > 0 && (
            <div className="space-y-1.5">
              {subtitles.map((sub, idx) => (
                <div key={idx} className="flex items-center justify-between bg-bg border border-line rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-semibold text-ink">{sub.label} ({sub.lang})</span>
                  <span className="text-ink-faint truncate max-w-xs font-mono">{sub.url}</span>
                  <button
                    type="button"
                    onClick={() => removeSubtitle(idx)}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newSubLang}
              onChange={(e) => setNewSubLang(e.target.value)}
              placeholder="Language (e.g. Swahili, English)"
              className="w-36 bg-bg border border-line rounded-lg px-3 py-1.5 text-xs text-ink"
            />
            <input
              type="text"
              value={newSubCode}
              onChange={(e) => setNewSubCode(e.target.value)}
              placeholder="Code (sw, en)"
              className="w-20 bg-bg border border-line rounded-lg px-3 py-1.5 text-xs text-ink"
            />
            <input
              type="url"
              value={newSubUrl}
              onChange={(e) => setNewSubUrl(e.target.value)}
              placeholder="Subtitle URL (.vtt / .srt)..."
              className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-gold/60"
            />
            <button
              type="button"
              onClick={addSubtitle}
              className="px-3 py-1.5 bg-bg-card border border-line rounded-lg text-xs font-medium text-ink hover:text-gold"
            >
              + Add Subtitle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
