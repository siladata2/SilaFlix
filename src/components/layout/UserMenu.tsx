'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-[34px] h-[34px] rounded-[7px] bg-gradient-to-br from-gold to-brand border border-line flex items-center justify-center flex-none"
        aria-label="Admin menu"
        aria-expanded={open}
      >
        <ShieldCheck size={18} className="text-bg" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-bg-raised border border-line rounded-xl overflow-hidden shadow-xl z-50">
          <div className="px-4 py-2 border-b border-line text-xs text-ink-faint">
            Administrator
          </div>
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-bg-card text-ink"
          >
            <ShieldCheck size={16} className="text-gold" />
            Admin Dashboard
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-brand hover:bg-bg-card border-t border-line"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
