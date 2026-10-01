'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/Toaster';
import type { DownloadOption } from '@/lib/types/database';

export function DownloadList({
  options,
}: {
  options: DownloadOption[];
  isAuthenticated?: boolean;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const toast = useToast();

  async function requestDownload(option: DownloadOption) {
    setPendingId(option.id);
    try {
      const res = await fetch(`/api/downloads/${option.id}/authorize`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body.error ?? 'This download is not available right now.');
        return;
      }
      const { url, expiresAt } = await res.json();
      toast(`Download ready — link expires ${new Date(expiresAt).toLocaleTimeString()}`);
      window.location.href = url;
    } catch {
      toast('Could not start download. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o) => {
        const qualityLabel = o.quality || '1080p';
        return (
          <div
            key={o.id}
            className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-line bg-bg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold text-xs tracking-wide">
                {qualityLabel}
              </span>
              {o.language && (
                <span className="text-ink-dim text-xs font-medium truncate">
                  {o.language}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => requestDownload(o)}
              disabled={pendingId === o.id}
              className="inline-flex items-center gap-2 bg-bg-card border border-line hover:border-ink-dim text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
            >
              <Download size={15} />
              <span>{pendingId === o.id ? 'Preparing…' : `Download (${qualityLabel})`}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
