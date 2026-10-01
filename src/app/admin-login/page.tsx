import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { AdminLoginForm } from '@/components/auth/AdminLoginForm';

export const metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

// Deliberately its OWN top-level route — NOT nested under /admin — so it
// never gets caught by the /admin/** auth gate in middleware.ts or
// src/app/admin/layout.tsx. See docs/ADMIN_SETUP.md for creating the
// matching Supabase account for a given username.
export default function AdminLoginPage() {
  return (
    <AuthCard title="SilaFlix staff sign in" subtitle="For admins and moderators only.">
      <Suspense fallback={null}>
        <AdminLoginForm />
      </Suspense>
    </AuthCard>
  );
}
