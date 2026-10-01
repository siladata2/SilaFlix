'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PublishToggleProps {
  table: string;
  id: string;
  isPublished?: boolean;
}

export function PublishToggle({ table, id, isPublished = false }: PublishToggleProps) {
  const [published, setPublished] = useState(isPublished);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const nextVal = !published;
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_published: nextVal, status: nextVal ? 'published' : 'draft' })
        .eq('id', id);

      if (!error) {
        setPublished(nextVal);
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
        published
          ? 'bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25'
          : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25'
      }`}
    >
      {loading ? '…' : published ? 'Published' : 'Draft'}
    </button>
  );
}
