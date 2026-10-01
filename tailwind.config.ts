import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0d0f17',
          card: '#161824',
          raised: '#1c1f30',
        },
        ink: {
          DEFAULT: '#f2ece4',
          dim: '#9ca3af',
          faint: '#6b7280',
        },
        line: '#26293b',
        gold: {
          DEFAULT: '#e5a93c',
        },
        brand: {
          DEFAULT: '#ef4444',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Fraunces', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
