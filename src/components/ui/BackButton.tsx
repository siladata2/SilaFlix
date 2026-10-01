'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

export function BackButton({
  fallbackHref = '/',
  label = 'Back',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-bg-card border border-line text-xs font-semibold text-ink hover:text-white hover:border-gold/50 transition-all shadow-sm ${className}`}
    >
      <ArrowLeft size={15} />
      <span>{label}</span>
    </button>
  );
}
