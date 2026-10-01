'use client';
import { useState } from 'react';
import { Play } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';

/**
 * Fetches playback details from /api/playback and opens VideoPlayer
 */
export function PlayButton({
  contentType,
  contentId,
  title,
  poster,
}: {
  contentType: 'movie' | 'episode' | 'recap' | 'reel';
  contentId: string;
  title: string;
  poster?: string;
}) {
  const [playbackData, setPlaybackData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function play() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/playback?type=${contentType}&id=${contentId}`);
      if (!res.ok) {
        setError('This title is not available to play right now.');
        return;
      }
      const data = await res.json();
      setPlaybackData(data);
    } catch {
      setError('Could not start playback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (playbackData) {
    return (
      <VideoPlayer
        src={playbackData.url}
        title={playbackData.title || title}
        poster={playbackData.poster || poster}
        qualities={playbackData.qualities}
        subtitles={playbackData.subtitles}
        downloadUrl={playbackData.downloadUrl}
        downloadEnabled={playbackData.isDownloadEnabled}
        onClose={() => setPlaybackData(null)}
      />
    );
  }

  return (
    <div>
      <button
        onClick={play}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-gold text-[#171412] font-semibold rounded-[7px] px-[18px] py-2.5 text-sm hover:bg-[#f0b25a] disabled:opacity-50"
      >
        <Play size={16} fill="currentColor" /> {loading ? 'Loading…' : 'Watch now'}
      </button>
      {error && <p className="text-brand text-sm mt-2">{error}</p>}
    </div>
  );
}
