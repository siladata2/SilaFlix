import { createAdminClient } from '@/lib/supabase/admin';
import { ReelsViewer } from '@/components/ReelsViewer';
import { BackButton } from '@/components/ui/BackButton';

export const dynamic = 'force-dynamic';

export default async function ReelsPage({ searchParams }: { searchParams: { id?: string } }) {
  const admin = createAdminClient();

  const { data: reels } = await admin
    .from('reels')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const list = reels || [];
  let startIndex = 0;
  if (searchParams.id) {
    const foundIdx = list.findIndex((r) => r.id === searchParams.id);
    if (foundIdx !== -1) startIndex = foundIdx;
  }

  if (list.length === 0) {
    return (
      <div className="wrap pt-28 pb-20 space-y-8">
        <BackButton fallbackHref="/" label="Back to Home" />
        <div className="text-center py-16 bg-bg-card border border-line rounded-2xl">
          <h1 className="font-display text-2xl text-white font-bold mb-2">No Reels Published Yet</h1>
          <p className="text-ink-faint text-sm">
            Check back soon for vertical shorts and movie highlights.
          </p>
        </div>
      </div>
    );
  }

  return <ReelsViewer reels={list as any} startIndex={startIndex} />;
}
