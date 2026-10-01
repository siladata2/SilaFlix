import React from 'react';

interface SilaFlixLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  stacked?: boolean;
  className?: string;
}

export function SilaFlixLogo({
  size = 'md',
  showTagline = false,
  stacked = false,
  className = '',
}: SilaFlixLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-[22px]',
    lg: 'text-3xl',
    xl: 'text-4xl sm:text-5xl',
  };

  return (
    <div
      className={`inline-flex ${
        stacked ? 'flex-col items-center text-center gap-2' : 'items-center gap-2.5'
      } select-none ${className}`}
    >
      {/* 3D Red Film-Strip "S" + Center Play Emblem */}
      <svg
        viewBox="0 0 220 220"
        className={`${iconSizes[size]} flex-none drop-shadow`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sfRibbonTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2e2e" />
            <stop offset="55%" stopColor="#e50914" />
            <stop offset="100%" stopColor="#850000" />
          </linearGradient>
          <linearGradient id="sfRibbonBottom" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff3b3b" />
            <stop offset="50%" stopColor="#d40812" />
            <stop offset="100%" stopColor="#750000" />
          </linearGradient>
          <linearGradient id="sfPlayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3838" />
            <stop offset="100%" stopColor="#b00000" />
          </linearGradient>
        </defs>

        <rect width="220" height="220" rx="44" fill="#080808" stroke="#261717" strokeWidth="4" />

        {/* Upper S Film Ribbon */}
        <path
          d="M 178 44 C 122 10, 42 30, 45 95 C 47 136, 85 162, 96 168 L 96 120 C 79 112, 75 94, 82 79 C 92 58, 130 62, 154 82 Z"
          fill="url(#sfRibbonTop)"
        />
        {/* Film perforations top-left */}
        <rect x="54" y="70" width="9" height="12" rx="1.5" transform="rotate(-18 54 70)" fill="#090404" />
        <rect x="58" y="90" width="9" height="12" rx="1.5" transform="rotate(-8 58 90)" fill="#090404" />
        <rect x="65" y="109" width="9" height="12" rx="1.5" transform="rotate(8 65 109)" fill="#090404" />

        {/* Lower S Film Ribbon */}
        <path
          d="M 44 176 C 100 210, 180 190, 177 125 C 175 84, 137 58, 126 52 L 126 100 C 143 108, 147 126, 140 141 C 130 162, 92 158, 68 138 Z"
          fill="url(#sfRibbonBottom)"
        />
        {/* Film perforations bottom-right */}
        <rect x="155" y="100" width="9" height="12" rx="1.5" transform="rotate(15 155 100)" fill="#090404" />
        <rect x="148" y="120" width="9" height="12" rx="1.5" transform="rotate(28 148 120)" fill="#090404" />
        <rect x="136" y="138" width="9" height="12" rx="1.5" transform="rotate(40 136 138)" fill="#090404" />

        {/* Center Play Triangle */}
        <path
          d="M 96 86 L 96 134 C 96 139, 101 142, 106 139 L 142 115 C 146 112, 146 108, 142 105 L 106 81 C 101 78, 96 81, 96 86 Z"
          fill="url(#sfPlayGrad)"
        />
      </svg>

      {/* Wordmark + Optional Tagline */}
      <div className="flex flex-col leading-none">
        <span className={`font-sans font-black tracking-tight ${textSizes[size]}`}>
          <span className="text-white">Sila</span>
          <span className="text-[#e50914]">Flix</span>
        </span>
        {showTagline && (
          <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-ink-dim mt-1">
            Your World of Entertainment
          </span>
        )}
      </div>
    </div>
  );
}
