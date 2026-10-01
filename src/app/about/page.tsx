import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="wrap pt-32 pb-20 max-w-2xl">
      <h1 className="font-display text-3xl mb-6">About SilaFlix</h1>
      <div className="prose prose-invert text-ink-dim leading-relaxed space-y-4">
        <p>SilaFlix is a global entertainment platform for authorized movies, TV series, episodes, reels, and movie recaps — built to bring original and licensed stories to audiences everywhere.</p>
        <p>Every title on SilaFlix is either owned by SilaFlix or distributed with the rights holder&apos;s permission. We do not host or link to unauthorized copies of copyrighted work.</p>
        <p>Your World of Entertainment — that&apos;s the promise: a premium, ad-light, cinematic experience across mobile, tablet, and desktop.</p>
      </div>
    </div>
  );
}
