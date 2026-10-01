'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RoleSelectProps {
  userId: string;
  currentRole: string;
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  async function handleChange(newRole: string) {
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as any })
        .eq('user_id', userId);
      if (!error) setRole(newRole);
    } catch (err) {
      console.error('Error changing role:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={role}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-bg border border-line rounded px-2 py-1 text-xs text-ink focus:outline-none focus:border-gold/60 capitalize"
    >
      <option value="user">User</option>
      <option value="moderator">Moderator</option>
      <option value="editor">Editor</option>
      <option value="admin">Admin</option>
      <option value="super_admin">Super Admin</option>
    </select>
  );
}
