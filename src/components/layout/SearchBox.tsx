'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, Film, Tv, Newspaper, Loader2 } from 'lucide-react';

interface SearchResultItem {
  id: string;
  title: string;
  slug: string;
  poster_url?: string | null;
  thumbnail_url?: string | null;
  release_year?: number | null;
}

interface SearchResults {
  movies: SearchResultItem[];
  series: SearchResultItem[];
  recaps: SearchResultItem[];
}

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const hasResults =
    results &&
    (results.movies.length > 0 || results.series.length > 0 || results.recaps.length > 0);

  return (
    <div ref={containerRef} className="relative w-44 sm:w-64 md:w-72">
      <div className="relative flex items-center">
        <Search
          size={15}
          className="absolute left-3 text-ink-faint pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search movies, series…"
          className="w-full bg-bg-card/90 border border-line rounded-full pl-9 pr-8 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold/60 transition-colors"
        />
        {loading ? (
          <Loader2 size={13} className="absolute right-3 animate-spin text-ink-faint" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults(null);
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-0.5 text-ink-faint hover:text-ink rounded-full"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-bg-card/95 backdrop-blur-md border border-line rounded-xl shadow-2xl py-2 z-50 max-h-96 overflow-y-auto">
          {loading && !hasResults ? (
            <div className="p-4 text-center text-xs text-ink-faint flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin text-gold" />
              Searching library…
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-xs text-ink-faint">
              No titles found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-3">
              {results.movies.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-gold uppercase tracking-wider flex items-center gap-1.5">
                    <Film size={12} /> Movies
                  </div>
                  {results.movies.map((item) => (
                    <Link
                      key={item.id}
                      href={`/movies/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-7 h-9 rounded bg-bg-raised flex-none overflow-hidden border border-line flex items-center justify-center">
                        {item.poster_url ? (
                          <img
                            src={item.poster_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film size={12} className="text-ink-faint" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-ink group-hover:text-gold truncate">
                          {item.title}
                        </div>
                        {item.release_year && (
                          <div className="text-[10px] text-ink-faint">{item.release_year}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.series.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-gold uppercase tracking-wider flex items-center gap-1.5">
                    <Tv size={12} /> Series
                  </div>
                  {results.series.map((item) => (
                    <Link
                      key={item.id}
                      href={`/series/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-7 h-9 rounded bg-bg-raised flex-none overflow-hidden border border-line flex items-center justify-center">
                        {item.poster_url ? (
                          <img
                            src={item.poster_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Tv size={12} className="text-ink-faint" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-ink group-hover:text-gold truncate">
                          {item.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.recaps.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-gold uppercase tracking-wider flex items-center gap-1.5">
                    <Newspaper size={12} /> Recaps
                  </div>
                  {results.recaps.map((item) => (
                    <Link
                      key={item.id}
                      href={`/recaps/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-7 h-9 rounded bg-bg-raised flex-none overflow-hidden border border-line flex items-center justify-center">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Newspaper size={12} className="text-ink-faint" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-ink group-hover:text-gold truncate">
                          {item.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
