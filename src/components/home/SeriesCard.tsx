import Link from 'next/link';
import { Tv } from 'lucide-react';
import type { Series } from '@/lib/types/database';

export function SeriesCard({ series }: { series: Series }) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-gold/50 transition-all shadow-sm"
    >
      <div className="aspect-[2/3] relative bg-bg-raised overflow-hidden">
        {series.poster_url ? (
          <img
            src={series.poster_url}
            alt={series.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint">
            <Tv size={24} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-xs text-white truncate group-hover:text-gold transition-colors">
          {series.title}
        </h3>
        <div className="flex items-center justify-between mt-1 text-[11px] text-ink-faint">
          <span>Series</span>
          {series.release_year && <span>{series.release_year}</span>}
        </div>
      </div>
    </Link>
  );
}
