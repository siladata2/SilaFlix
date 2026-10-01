'use client';

import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  wallpaperUrl?: string;
  durationSeconds?: number;
}

const DEFAULT_WALLPAPER = 'https://i.ibb.co/93Gb20Zq/Sila-Flix.jpg';

export function SplashScreen({
  wallpaperUrl = DEFAULT_WALLPAPER,
  durationSeconds = 3,
}: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  const effectiveUrl = wallpaperUrl?.trim() || DEFAULT_WALLPAPER;
  const clampedSeconds = Math.min(4, Math.max(2, Number(durationSeconds) || 3));

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, clampedSeconds * 1000 - 450);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, clampedSeconds * 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [clampedSeconds]);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden select-none transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <img
        src={effectiveUrl}
        alt="SilaFlix"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
      <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
        <div className="w-8 h-8 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
