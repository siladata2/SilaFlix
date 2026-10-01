'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Clapperboard, Radio } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/live', label: 'Live TV', icon: Radio },
  { href: '/movies', label: 'Movies', icon: Film },
  { href: '/series', label: 'Series', icon: Tv },
  { href: '/reels', label: 'Reels', icon: Clapperboard },
];

export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-[200] bg-bg-raised border-t border-line flex justify-around py-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-1 text-[11px]"
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} className={active ? 'text-gold' : 'text-ink-faint'} />
            <span className={active ? 'text-gold' : 'text-ink-faint'}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
