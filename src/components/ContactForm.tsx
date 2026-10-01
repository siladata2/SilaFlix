'use client';
import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, category, message, website }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact form');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit message. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-bg-card border border-line rounded-xl p-8 text-center space-y-3">
        <CheckCircle2 size={40} className="text-green-400 mx-auto" />
        <h3 className="font-display font-semibold text-lg text-ink">Message received!</h3>
        <p className="text-xs text-ink-dim">
          Thank you for reaching out. Our support team will review your message and reply via email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-bg-card border border-line rounded-xl p-6">
      {/* Honeypot field (hidden from real users) */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Your Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Subject</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-dim mb-1 font-medium">Topic</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
          >
            <option value="general">General inquiry</option>
            <option value="technical">Technical issue</option>
            <option value="account">Account question</option>
            <option value="copyright">Copyright / DMCA</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-dim mb-1 font-medium">Message</label>
        <textarea
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe how we can help you…"
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      {error && <p className="text-xs text-brand">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold hover:bg-[#f0b25a] text-[#171412] font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Send Message
      </button>
    </form>
  );
}
