'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Film,
  Tv,
  Layers,
  Clapperboard,
  Newspaper,
  Tags,
  Users,
  Download,
  Flag,
  BarChart3,
  ScrollText,
  Settings,
  ExternalLink,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SilaFlixLogo } from '@/components/ui/SilaFlixLogo';

const items = [
  { href: '/admin', label: 'Dashboard & Quick Studio', icon: LayoutDashboard },
  { href: '/admin/movies', label: 'Movies & Live TV', icon: Film },
  { href: '/admin/series', label: 'Series', icon: Tv },
  { href: '/admin/seasons', label: 'Seasons', icon: Layers },
  { href: '/admin/episodes', label: 'Episodes', icon: Layers },
  { href: '/admin/reels', label: 'Reels', icon: Clapperboard },
  { href: '/admin/recaps', label: 'Recaps', icon: Newspaper },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/downloads', label: 'Downloads', icon: Download },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      document.cookie = 'silaflix_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      document.cookie = 'silaflix_admin_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      document.cookie = 'silaflix_admin_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      localStorage.removeItem('silaflix_admin_logged_in');
    } catch {
      // Ignore
    }
    window.location.href = '/admin-login';
  }

  const currentItem = items.find((i) =>
    i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)
  ) || items[0];

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden sticky top-0 z-50 bg-bg-raised border-b border-line px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-1.5 rounded-lg bg-bg-card border border-line text-ink"
              aria-label="Toggle admin menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/admin" className="flex items-center gap-1.5">
              <SilaFlixLogo size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-ink-dim hover:text-ink flex items-center gap-1 bg-bg-card border border-line px-2.5 py-1.5 rounded-md"
            >
              <ExternalLink size={12} />
              <span>Site</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs text-brand hover:text-red-400 flex items-center gap-1 bg-bg-card border border-line px-2.5 py-1.5 rounded-md"
              title="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>

        {/* Current section indicator + Quick scroll tabs */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {items.slice(0, 8).map(({ href, label, icon: Icon }) => {
            const active =
              href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'bg-gold text-[#171412] font-semibold'
                    : 'bg-bg-card text-ink-dim hover:text-ink border border-line'
                }`}
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Full Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-1.5 max-h-[70vh] overflow-y-auto">
            {items.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-gold/15 text-gold border border-gold/40'
                      : 'bg-bg-card text-ink-dim hover:bg-line/40'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-line bg-bg-raised z-40">
        {/* Brand */}
        <div className="p-5 border-b border-line">
          <Link href="/admin" className="block">
            <SilaFlixLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2 mt-2 text-xs text-ink-faint">
            <ShieldCheck size={14} className="text-[#e50914]" />
            <span>Admin Control Studio</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ${
                  active
                    ? 'bg-gold text-[#171412] font-semibold shadow-sm'
                    : 'text-ink-dim hover:text-ink hover:bg-bg-card'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="p-3 border-t border-line space-y-1 bg-bg/50">
          <Link
            href="/"
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-ink-dim hover:text-ink hover:bg-bg-card rounded-md transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={14} />
              View Live Website
            </span>
            <span className="text-[10px] text-ink-faint bg-bg-card px-1.5 py-0.5 rounded border border-line">
              Home
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-brand hover:text-red-400 hover:bg-bg-card rounded-md transition-colors"
          >
            <LogOut size={14} />
            Sign Out of Admin
          </button>
        </div>
      </aside>
    </>
  );
}
