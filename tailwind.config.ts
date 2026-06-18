import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f3f8',
          100: '#d9e0ec',
          200: '#b3c1d9',
          300: '#8da2c6',
          400: '#6783b3',
          500: '#3d5a8a',
          600: '#2d4470',
          700: '#1e3050',
          800: '#162340',
          900: '#0f172a',
          950: '#080d1a',
        },
        gold: {
          50:  '#fdf9ef',
          100: '#f5e6c8',
          200: '#ecd3a1',
          300: '#e0bc73',
          400: '#d4a853',
          500: '#c49a42',
          600: '#b8923a',
          700: '#9a7830',
          800: '#7c6027',
          900: '#5e481e',
        },
        surface: {
          0:      '#ffffff',
          50:     '#f8f9fb',
          100:    '#f1f3f7',
          border: '#e5e7eb',
        },
      },
      boxShadow: {
        'card':       '0 2px 8px rgba(0,0,0,0.05)',
        'card-hover': '0 8px 24px rgba(15,23,42,0.10)',
        'cta':        '0 4px 14px rgba(212,168,83,0.35)',
        'cta-hover':  '0 8px 20px rgba(212,168,83,0.45)',
        'header':     '0 1px 0 rgba(0,0,0,0.04)',
        'premium':    '0 0 0 1px rgba(212,168,83,0.15), 0 4px 16px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans:    ['var(--font-noto)', 'sans-serif'],
        display: ['var(--font-playfair)', 'var(--font-noto)', 'serif'],
      },
      backgroundImage: {
        'hero-gradient':  'linear-gradient(160deg, #080d1a 0%, #0f172a 40%, #1e293b 100%)',
        'cta-gradient':   'linear-gradient(135deg, #d4a853 0%, #b8923a 60%, #9a7830 100%)',
        'navy-gradient':  'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gold-shimmer':   'linear-gradient(105deg, transparent 40%, rgba(212,168,83,0.06) 50%, transparent 60%)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease-out both',
        'fade-up-1': 'fadeUp 0.5s 75ms ease-out both',
        'fade-up-2': 'fadeUp 0.5s 150ms ease-out both',
        'fade-up-3': 'fadeUp 0.5s 225ms ease-out both',
        'fade-in':   'fadeIn 0.4s ease-out both',
        'shimmer':   'shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
