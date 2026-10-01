'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

const DEFAULT_SPLASH_URL = 'https://i.ibb.co/93Gb20Zq/Sila-Flix.jpg';

export function AppSettingsForm({ settings }: { settings: any[] }) {
  const router = useRouter();
  const getInitial = (key: string, fallback: string) => {
    const found = settings.find((s) => s.key === key);
    if (!found || found.value === null || found.value === undefined) return fallback;
    return typeof found.value === 'string' ? found.value : String(found.value);
  };

  const [siteName, setSiteName] = useState(getInitial('site_name', 'SilaFlix'));
  const [supportPhone, setSupportPhone] = useState(getInitial('support_phone', '+255789661031'));
  const [supportEmail, setSupportEmail] = useState(
    getInitial('support_email', 'support@silaflix.com')
  );
  const [splashWallpaperUrl, setSplashWallpaperUrl] = useState(
    getInitial('splash_wallpaper_url', DEFAULT_SPLASH_URL)
  );
  const [splashDuration, setSplashDuration] = useState(
    getInitial('splash_duration_seconds', '3')
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: siteName.trim() || 'SilaFlix',
          support_phone: supportPhone.trim() || '+255789661031',
          support_email: supportEmail.trim() || 'support@silaflix.com',
          splash_wallpaper_url: splashWallpaperUrl.trim() || DEFAULT_SPLASH_URL,
          splash_duration_seconds: String(
            Math.min(4, Math.max(2, Number(splashDuration) || 3))
          ),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to save settings');
      } else {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3500);
      }
    } catch {
      setError('Connection interrupted. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-5 bg-bg-card border border-line rounded-2xl p-6"
    >
      {/* Startup Wallpaper Section */}
      <div className="space-y-4 pb-5 border-b border-line">
        <div className="flex items-center gap-2 text-gold font-semibold text-sm">
          <ImageIcon size={18} />
          <span>Fullscreen Startup Wallpaper (Splash Screen)</span>
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">
            Startup Wallpaper Image Link (URL)
          </label>
          <input
            type="url"
            value={splashWallpaperUrl}
            onChange={(e) => setSplashWallpaperUrl(e.target.value)}
            placeholder="https://i.ibb.co/93Gb20Zq/Sila-Flix.jpg"
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
          <p className="text-[11px] text-ink-faint mt-1">
            Displayed fullscreen when opening the app before transitioning to the Home page.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs text-ink-dim mb-1 font-medium">
              Splash Duration (2 to 4 Seconds)
            </label>
            <select
              value={splashDuration}
              onChange={(e) => setSplashDuration(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
            >
              <option value="2">2 Seconds</option>
              <option value="3">3 Seconds (Recommended)</option>
              <option value="4">4 Seconds</option>
            </select>
          </div>

          {splashWallpaperUrl && (
            <div className="rounded-xl overflow-hidden border border-line bg-black aspect-video max-h-28">
              <img
                src={splashWallpaperUrl}
                alt="Splash Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* General Platform Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Platform Name</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Support Phone</label>
          <input
            type="text"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-dim mb-1 font-medium">Support Email</label>
        <input
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {saved && (
        <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
          <CheckCircle2 size={15} /> Settings & startup wallpaper saved!
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-gold hover:bg-[#f0b25a] text-[#171412] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        Save Settings
      </button>
    </form>
  );
}
