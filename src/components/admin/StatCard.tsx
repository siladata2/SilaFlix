import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
}

export function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <div className="bg-bg-card border border-line rounded-xl p-4">
      <div className="text-xs text-ink-faint font-medium mb-1">{label}</div>
      <div className="text-2xl font-display font-bold text-ink">{value}</div>
      {subtext && <div className="text-[11px] text-ink-dim mt-1">{subtext}</div>}
    </div>
  );
}
