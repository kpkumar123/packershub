/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#E8510A',
          gold:   '#C9961F',
          dark:   '#0D1117',
          grey:   '#64748B',
          light:  '#F8FAFC',
        },
        accent: {
          sky:    '#0EA5E9',
          teal:   '#0D9488',
          amber:  '#F59E0B',
        },
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Sora"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up':      'fadeUp .7s cubic-bezier(.16,1,.3,1) both',
        'fade-in':      'fadeIn .5s ease both',
        'float':        'float 7s ease-in-out infinite',
        'pulse-ring':   'pulseRing 2s ease-out infinite',
        'shine':        'shine 3s linear infinite',
        'slide-right':  'slideRight .8s cubic-bezier(.16,1,.3,1) both',
        'count-up':     'countUp .5s ease both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-18px)' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)', opacity: '.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shine: {
          from: { backgroundPosition: '-200%' },
          to:   { backgroundPosition: '200%' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'scale(.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04)',
        'card':  '0 4px 24px rgba(0,0,0,.06)',
        'glow':  '0 0 32px rgba(232,81,10,.25)',
        'cta':   '0 8px 32px rgba(232,81,10,.4)',
      },
      backgroundImage: {
        'hero-mesh':   'radial-gradient(at 20% 20%, #FFF5EE 0%, transparent 55%), radial-gradient(at 80% 80%, #EFF6FF 0%, transparent 55%)',
        'card-shine':  'linear-gradient(135deg, transparent 40%, rgba(255,255,255,.3) 50%, transparent 60%)',
        'orange-grad': 'linear-gradient(135deg, #E8510A 0%, #C9961F 100%)',
        'dark-grad':   'linear-gradient(135deg, #0D1117 0%, #1E293B 100%)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
