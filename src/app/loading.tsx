export default function Loading() {
  return (
    <div className="wrap py-24 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-line border-t-gold animate-spin" aria-label="Loading" role="status" />
    </div>
  );
}
