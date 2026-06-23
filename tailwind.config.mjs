/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        olive: {
          50:  '#f6f8ee',
          100: '#eaf0d6',
          200: '#d3e0ac',
          300: '#b6cd7e',
          400: '#98b955',
          500: '#7a9a3b',
          600: '#62802e',
          700: '#4f6726',
          800: '#3f5220',
          900: '#34441c',
        },
        orange: {
          50:  '#fff8ef',
          100: '#ffeed9',
          200: '#ffdbac',
          300: '#ffc179',
          400: '#ffa64d',
          500: '#fb8c2e',
          600: '#e8711a',
          700: '#c75c12',
        },
        ink: '#13141a',
        dark: '#0f172a',
        navy: '#14140f',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #f0f5ff 0%, #f6f8ee 35%, #fff8ef 70%, #ffffff 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        'brand-gradient': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        'olive-gradient': 'linear-gradient(135deg, #7a9a3b, #4f6726)',
        'orange-gradient': 'linear-gradient(135deg, #ffa64d, #e8711a)',
        'ink-gradient': 'linear-gradient(180deg, #1c1d17 0%, #0a0a08 100%)',
      },
      animation: {
        'fade-up':     'fadeUp 0.6s ease-out forwards',
        'fade-in':     'fadeIn 0.5s ease-out forwards',
        'pulse-slow':  'pulse 4s ease-in-out infinite',
        'float':       'float 7s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'ping-slow':   'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glow':  '0 0 40px rgba(37, 99, 235, 0.3)',
        'glow-gold': '0 0 30px rgba(245, 158, 11, 0.4)',
        'card':  '0 4px 24px rgba(0, 0, 0, 0.08)',
        'hover': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
