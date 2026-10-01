import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MovieForm } from '@/components/admin/MovieForm';

export default async function EditMoviePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: movie } = await supabase.from('movies').select('*').eq('id', params.id).maybeSingle();
  if (!movie) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Edit movie</h1>
      <MovieForm movie={movie} />
    </div>
  );
}
