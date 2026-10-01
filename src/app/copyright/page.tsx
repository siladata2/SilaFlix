import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Copyright' };

export default function CopyrightPage() {
  return (
    <div className="wrap pt-32 pb-20 max-w-2xl prose prose-invert text-ink-dim leading-relaxed">
      <h1 className="font-display text-3xl mb-6 text-ink">Copyright</h1>
      <p>SilaFlix only distributes content it owns, licenses, or has explicit permission to publish. If you believe your copyrighted work has been used on SilaFlix without authorization, please contact us with:</p>
      <ul>
        <li>A description of the copyrighted work</li>
        <li>The URL of the content on SilaFlix</li>
        <li>Your contact information</li>
        <li>A statement that you have a good-faith belief the use is unauthorized</li>
      </ul>
      <p>Send reports via the <a href="/contact" className="text-gold">Contact page</a> (choose &quot;Copyright report&quot;). We review and act on valid reports promptly.</p>
    </div>
  );
}
