import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { ClientNetworkGuard } from '@/components/ui/ClientNetworkGuard';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSiteUrl } from '@/lib/utils';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'SilaFlix — Your World of Entertainment', template: '%s | SilaFlix' },
  description:
    'Stream full-length movies, 24/7 live TV channels, series, reels, and recaps on SilaFlix.',
  openGraph: {
    siteName: 'SilaFlix',
    type: 'website',
    locale: 'en',
  },
  robots: { index: true, follow: true },
};

const earlyGuardScript = `
(function(){
  try {
    var orig = JSON.stringify;
    JSON.stringify = function(value, replacer, space) {
      try {
        return orig.call(this, value, replacer, space);
      } catch (e) {
        try {
          var seen = new WeakSet();
          return orig.call(this, value, function(k, v) {
            if (typeof k === 'string' && (k.indexOf('__react') === 0)) return undefined;
            if (typeof v === 'object' && v !== null) {
              if (seen.has(v)) return undefined;
              seen.add(v);
              if (typeof Node !== 'undefined' && v instanceof Node) {
                return { nodeName: v.nodeName, id: v.id || undefined };
              }
            }
            return typeof replacer === 'function' ? replacer.call(this, k, v) : v;
          }, space);
        } catch (_) {
          return "null";
        }
      }
    };
  } catch (_) {}
})();
`;

const DEFAULT_SPLASH_WALLPAPER = 'https://i.ibb.co/93Gb20Zq/Sila-Flix.jpg';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let splashUrl = DEFAULT_SPLASH_WALLPAPER;
  let splashDuration = 3;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('app_settings')
      .select('key, value')
      .in('key', ['splash_wallpaper_url', 'splash_duration_seconds']);

    if (data) {
      const urlRow = data.find((r: any) => r.key === 'splash_wallpaper_url');
      if (urlRow?.value && String(urlRow.value).trim()) {
        splashUrl = String(urlRow.value).trim();
      }
      const durRow = data.find((r: any) => r.key === 'splash_duration_seconds');
      if (durRow?.value) {
        const parsed = Number(durRow.value);
        if (parsed >= 2 && parsed <= 4) {
          splashDuration = parsed;
        }
      }
    }
  } catch {
    // Use defaults if DB query fails
  }

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: earlyGuardScript }} />
      </head>
      <body className="font-sans antialiased">
        <ClientNetworkGuard />
        <SplashScreen wallpaperUrl={splashUrl} durationSeconds={splashDuration} />
        <Header />
        <MobileNav />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
