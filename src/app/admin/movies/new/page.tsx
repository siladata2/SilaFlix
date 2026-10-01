import { MovieForm } from '@/components/admin/MovieForm';

export default function NewMoviePage() {
  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Add movie</h1>
      <MovieForm />
    </div>
  );
}
