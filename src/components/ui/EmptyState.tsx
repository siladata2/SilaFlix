import React from 'react';
import { Film } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="bg-bg-card border border-line rounded-2xl p-10 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-bg-raised flex items-center justify-center mx-auto mb-4 text-ink-faint border border-line">
        <Film size={24} />
      </div>
      <h3 className="font-display font-semibold text-lg text-ink mb-1">{title}</h3>
      <p className="text-xs text-ink-dim max-w-sm mx-auto mb-6 leading-relaxed">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
