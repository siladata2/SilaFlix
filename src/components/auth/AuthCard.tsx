import React from 'react';
import Link from 'next/link';
import { SilaFlixLogo } from '@/components/ui/SilaFlixLogo';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg">
      <div className="w-full max-w-md bg-bg-card border border-line rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-4">
            <SilaFlixLogo size="lg" showTagline={true} stacked={true} />
          </Link>
          <h1 className="text-xl font-display font-semibold text-ink">{title}</h1>
          {subtitle && <p className="text-xs text-ink-dim mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
