import Link from 'next/link';
import { Film, Radio } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center wrap py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">404</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
        Page Not Found
      </h1>
      <p className="text-sm text-ink-dim max-w-md mb-8">
        The title or channel you are looking for may have been moved or is temporarily unavailable.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gold text-[#171412] font-semibold px-5 py-2.5 rounded-xl text-xs hover:bg-[#f0b25a] transition-colors"
        >
          <Film size={15} /> Back to Home
        </Link>
        <Link
          href="/live"
          className="inline-flex items-center gap-2 bg-bg-card border border-line text-white font-semibold px-5 py-2.5 rounded-xl text-xs hover:border-gold/50 transition-colors"
        >
          <Radio size={15} className="text-[#e50914]" /> Watch Live TV
        </Link>
      </div>
    </div>
  );
}
