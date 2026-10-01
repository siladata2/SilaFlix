import Link from 'next/link';
import { Film, Play } from 'lucide-react';
import type { Movie } from '@/lib/types/database';

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={`/movies/${movie.slug}`}
      className="group block bg-bg-card rounded-xl overflow-hidden border border-line hover:border-gold/50 transition-all shadow-sm"
    >
      <div className="aspect-[2/3] relative bg-bg-raised overflow-hidden">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint">
            <Film size={24} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gold text-[#171412] flex items-center justify-center shadow-lg">
            <Play size={18} className="fill-current ml-0.5" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-xs text-white truncate group-hover:text-gold transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mt-1 text-[11px] text-ink-faint">
          <span>{movie.release_year || 'Movie'}</span>
          {movie.content_rating && (
            <span className="border border-line px-1 rounded text-[10px]">
              {movie.content_rating}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
