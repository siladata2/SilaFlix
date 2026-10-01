import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SearchBox } from './SearchBox';
import { UserMenu } from './UserMenu';
import { ShieldCheck } from 'lucide-react';
import { SilaFlixLogo } from '@/components/ui/SilaFlixLogo';

const navLinks = [
  { href: '/live', label: 'Live TV', isLive: true },
  { href: '/movies', label: 'Movies' },
  { href: '/series', label: 'Series' },
  { href: '/reels', label: 'Reels' },
  { href: '/recaps', label: 'Recaps' },
  { href: '/categories', label: 'Categories' },
];

export async function Header() {
  const cookieStore = cookies();
  const hasAdminSession = cookieStore.get('silaflix_admin_session')?.value === 'true';
  const hasSbCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-'));

  let user: any = null;
  if (hasSbCookie) {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch {
      user = null;
    }
  }

  const isLoggedIn = Boolean(user || hasAdminSession);

  return (
    <header className="fixed top-0 inset-x-0 z-[200] py-3.5 bg-bg/90 backdrop-blur-md border-b border-line/40 transition-colors">
      <div className="wrap flex items-center gap-7">
        <Link href="/" className="flex-none">
          <SilaFlixLogo size="sm" />
        </Link>

        <nav className="hidden md:flex gap-6 flex-1 items-center">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14.5px] font-medium text-ink-dim hover:text-ink transition-colors inline-flex items-center gap-1.5"
            >
              {l.isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 flex-none ml-auto">
          <SearchBox />
          {isLoggedIn ? (
            <>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gold text-[#171412] rounded-lg hover:bg-[#f0b25a] shadow-sm transition-all"
              >
                <ShieldCheck size={14} />
                <span className="hidden sm:inline">Admin Dashboard</span>
                <span className="sm:hidden">Admin</span>
              </Link>
              <UserMenu />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
