import Link from 'next/link';
import { SilaFlixLogo } from '@/components/ui/SilaFlixLogo';

const supportPhone =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '+255789661031';

type FooterLink = [label: string, href: string];

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const columns: FooterColumn[] = [
  {
    title: 'Browse',
    links: [
      ['Live TV Channels', '/live'],
      ['Movies', '/movies'],
      ['Series', '/series'],
      ['Reels', '/reels'],
      ['Recaps', '/recaps'],
      ['Categories', '/categories'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About SilaFlix', '/about'],
      ['Contact', '/contact'],
      ['Help centre', '/help'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy', '/privacy'],
      ['Terms of use', '/terms'],
      ['Copyright', '/copyright'],
    ],
  },
  {
    title: 'Management',
    links: [
      ['Admin Portal', '/admin-login'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line mt-24 pb-24 md:pb-9 pt-14">
      <div className="wrap">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-11">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="mb-3 inline-block">
              <SilaFlixLogo size="md" showTagline={true} />
            </Link>

            <p className="text-[13px] text-ink-faint leading-relaxed max-w-[32ch] mb-3">
              Your World of Entertainment — original and licensed movies,
              series, reels and recaps.
            </p>

            <p className="text-[13px] text-ink-dim">
              Support:{' '}
              <a
                href={`tel:${supportPhone}`}
                className="hover:text-gold"
              >
                {supportPhone}
              </a>
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold mb-3.5">
                {col.title}
              </h4>

              {col.links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block text-[13.5px] text-ink-faint hover:text-gold mb-2.5"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center flex-wrap gap-3 pt-6 border-t border-line text-[12.5px] text-ink-faint">
          <span>
            © {new Date().getFullYear()} SilaFlix. All titles are original
            productions or licensed content.
          </span>
          <Link href="/admin-login" className="hover:text-gold transition-colors">
            Staff Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}
