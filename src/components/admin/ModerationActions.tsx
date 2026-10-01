'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function ModerationActions({ table, id }: { table: string; id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function update(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reels?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStatus('deleted');
        router.refresh();
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  }

  if (status) {
    return <span className="text-xs capitalize text-ink-faint">{status}</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2.5 text-xs">
      <button
        type="button"
        onClick={() => update('approved')}
        disabled={loading}
        className="text-green-400 hover:underline font-medium"
      >
        Approve
      </button>
      <span className="text-line">|</span>
      <button
        type="button"
        onClick={() => update('rejected')}
        disabled={loading}
        className="text-amber-400 hover:underline"
      >
        Hide
      </button>
      {table === 'reels' && (
        <>
          <span className="text-line">|</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-400 hover:text-red-300 inline-flex items-center gap-1"
            title="Delete Reel"
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}
