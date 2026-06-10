import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        azure: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        surface: {
          0:      '#ffffff',
          50:     '#f8faff',
          100:    '#f1f5fd',
          border: '#e4ecfb',
        },
      },
      boxShadow: {
        'card':       '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px rgba(37,99,235,0.12)',
        'cta':        '0 4px 14px rgba(37,99,235,0.35)',
        'cta-hover':  '0 8px 20px rgba(37,99,235,0.45)',
        'header':     '0 1px 0 rgba(0,0,0,0.04)',
      },
      fontFamily: {
        sans:    ['var(--font-noto)', 'sans-serif'],
        display: ['var(--font-outfit)', 'var(--font-noto)', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient':  'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 45%, #2563eb 100%)',
        'cta-gradient':   'linear-gradient(135deg, #2563eb 0%, #1d4ed8 60%, #1e40af 100%)',
        'azure-gradient': 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
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
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease-out both',
        'fade-up-1': 'fadeUp 0.5s 75ms ease-out both',
        'fade-up-2': 'fadeUp 0.5s 150ms ease-out both',
        'fade-up-3': 'fadeUp 0.5s 225ms ease-out both',
        'fade-in':   'fadeIn 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
