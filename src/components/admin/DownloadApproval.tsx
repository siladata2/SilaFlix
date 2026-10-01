'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function DownloadApproval({ id, status }: { id: string; status: string }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  async function update(newStatus: 'approved' | 'revoked') {
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('download_options')
        .update({
          authorization_status: newStatus,
          is_active: newStatus === 'approved',
          approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (!error) setCurrentStatus(newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === 'approved') {
    return (
      <button
        onClick={() => update('revoked')}
        disabled={loading}
        className="text-xs text-red-400 hover:underline px-2 py-1"
      >
        Revoke
      </button>
    );
  }

  return (
    <button
      onClick={() => update('approved')}
      disabled={loading}
      className="text-xs text-gold font-semibold hover:underline px-2 py-1"
    >
      Approve
    </button>
  );
}
