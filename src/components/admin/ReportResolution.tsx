'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ReportResolution({ id, status }: { id: string; status: string }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  async function resolve(newStatus: 'resolved' | 'dismissed') {
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', id);
      if (!error) setCurrentStatus(newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === 'resolved' || currentStatus === 'dismissed') {
    return <span className="text-xs text-ink-faint">Closed</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      <button
        onClick={() => resolve('resolved')}
        disabled={loading}
        className="text-green-400 hover:underline font-medium"
      >
        Resolve
      </button>
      <span className="text-line">|</span>
      <button
        onClick={() => resolve('dismissed')}
        disabled={loading}
        className="text-ink-faint hover:text-ink"
      >
        Dismiss
      </button>
    </div>
  );
}
