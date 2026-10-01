'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Loader2 } from 'lucide-react';

export function NewCategoryForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleNameChange(val: string) {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from('categories').insert({
      name: name.trim(),
      slug: slug.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName('');
    setSlug('');
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-bg-card border border-line rounded-xl p-4 flex flex-wrap items-end gap-3"
    >
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs text-ink-dim mb-1 font-medium">Category Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Action"
          required
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs text-ink-dim mb-1 font-medium">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. action"
          required
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/60"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-gold hover:bg-[#f0b25a] text-[#171412] font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        Add Category
      </button>

      {error && <p className="w-full text-xs text-brand mt-1">{error}</p>}
    </form>
  );
}
