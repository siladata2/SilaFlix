'use client';
import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Call server API to authenticate, auto-provision and set SameSite=None cookies
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoading(false);
        setError(data.error || 'Invalid admin credentials');
        return;
      }

      setSuccess(true);

      // 2. Also authenticate client-side Supabase client for localStorage caching
      try {
        const supabase = createClient();
        const email = username.includes('@') ? username : `${username}@silaflix.app`;
        await supabase.auth.signInWithPassword({ email, password });
      } catch {
        // Safe to ignore if browser blocks client connection
      }

      // 3. Set client-side cookies with SameSite=None; Secure for iframe safety
      try {
        document.cookie = `silaflix_admin_session=true; path=/; max-age=604800; SameSite=None; Secure`;
        document.cookie = `silaflix_admin_email=${encodeURIComponent(username)}; path=/; max-age=604800; SameSite=None; Secure`;
        localStorage.setItem('silaflix_admin_logged_in', 'true');
      } catch {
        // Storage fallback
      }

      // 4. Navigate directly to Admin Dashboard
      const params = new URLSearchParams(window.location.search);
      const target = params.get('redirectTo') || '/admin';

      setTimeout(() => {
        window.location.replace(target);
      }, 300);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Connection error. Please try again.');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label className="block text-[12.5px] text-ink-dim mb-1.5 font-medium">
          Admin username or email
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          required
          autoComplete="username"
          placeholder="e.g. sila22 or hackersila2@gmail.com"
          className="w-full bg-bg-card border border-line rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold/60 text-ink"
        />
        <p className="text-[11px] text-ink-faint mt-1">
          Enter your admin username (e.g. sila22) or your email address
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-[12.5px] text-ink-dim mb-1.5 font-medium">Password</label>
        <div className="relative">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Enter admin password"
            className="w-full bg-bg-card border border-line rounded-lg px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-gold/60 text-ink"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
          <ShieldCheck size={16} />
          Access granted! Opening Admin Dashboard…
        </div>
      )}

      <button
        type="submit"
        disabled={loading || success}
        className="w-full bg-gold text-[#171412] font-semibold rounded-lg py-2.5 text-sm hover:bg-[#f0b25a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Authenticating…
          </>
        ) : success ? (
          'Opening Dashboard…'
        ) : (
          'Sign in to Admin Dashboard'
        )}
      </button>

      <p className="text-center mt-5 text-[12.5px] text-ink-faint">
        <a href="/" className="hover:text-gold transition-colors">
          ← Back to SilaFlix Home
        </a>
      </p>
    </form>
  );
}
