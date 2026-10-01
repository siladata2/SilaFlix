'use client';
import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toaster';
import type { ContentType } from '@/lib/types/database';

export function WatchlistButton({
  contentType,
  contentId,
  initialSaved = false,
}: {
  contentType: ContentType;
  contentId: string;
  initialSaved?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const toast = useToast();

  useEffect(() => {
    try {
      const local = localStorage.getItem(`silaflix_saved_${contentId}`);
      if (local === 'true') {
        setSaved(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [contentId]);

  async function toggle() {
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      localStorage.setItem(`silaflix_saved_${contentId}`, String(nextSaved));
    } catch {
      // Ignore localStorage errors
    }

    toast(nextSaved ? 'Added to My List' : 'Removed from My List');

    // Attempt backend sync in case user is signed in as admin/staff
    try {
      await fetch('/api/watchlist', {
        method: nextSaved ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, content_id: contentId }),
      });
    } catch {
      // Silent catch
    }
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 border border-line rounded-[7px] px-[18px] py-2.5 text-sm font-semibold hover:border-ink-dim transition-colors"
    >
      {saved ? <Check size={16} className="text-gold" /> : <Plus size={16} />} My List
    </button>
  );
}
