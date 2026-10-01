'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wrap py-24 text-center">
      <h1 className="font-display text-3xl mb-3">Something went wrong</h1>
      <p className="text-ink-dim mb-6 max-w-md mx-auto">
        We couldn&apos;t load this page. Try again, or head back to the homepage.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => reset()} className="btn btn-gold">
          Try again
        </button>
        <a href="/" className="btn btn-ghost">
          Go home
        </a>
      </div>
    </div>
  );
}
