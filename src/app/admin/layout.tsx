import { requireRole } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('moderator');

  return (
    <div className="min-h-screen bg-bg text-ink">
      <AdminSidebar />
      <div className="md:pl-64 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 px-4 sm:px-6 md:px-10 py-6 md:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
