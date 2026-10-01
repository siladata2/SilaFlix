import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Help Centre' };
const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '+255789661031';

const faqs = [
  { q: 'How do I download a title for offline viewing?', a: 'Open any movie or episode page and tap Download next to an available quality. Downloads are licensed per title and links expire after a short window for security.' },
  { q: 'Why can\'t I see a download option for a title?', a: 'Downloads only appear once SilaFlix has authorization to distribute that specific file. Not every title is approved for download.' },
  { q: 'How do I report a technical problem?', a: 'Use the Contact page and choose "Technical support" — include the title name and device you were using.' },
  { q: 'How do I report copyrighted content?', a: 'Use the Contact page and choose "Copyright report", or visit our Copyright page for the full process.' },
  { q: 'Can I change my subscription plan?', a: 'Yes — manage your plan from Settings once signed in.' },
];

export default function HelpPage() {
  return (
    <div className="wrap pt-32 pb-20 max-w-2xl">
      <h1 className="font-display text-3xl mb-2">Help centre</h1>
      <p className="text-ink-faint mb-8">
        Need to talk to someone? Call <a href={`tel:${supportPhone}`} className="text-gold">{supportPhone}</a> or use the <a href="/contact" className="text-gold">contact form</a>.
      </p>
      <div className="flex flex-col gap-3">
        {faqs.map((f) => (
          <details key={f.q} className="bg-bg-card border border-line rounded-lg p-4 group">
            <summary className="font-semibold text-sm cursor-pointer">{f.q}</summary>
            <p className="text-ink-dim text-sm mt-2">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
