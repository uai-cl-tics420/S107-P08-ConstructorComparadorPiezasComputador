/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        'dark': {
          'base': '#050505',
          'surface': '#0F0F0F',
          'elevated': '#1A1A1A',
          'border': '#2A2A2A',
        },
        'text': {
          'primary': '#FAFAFA',
          'muted': '#6B7280',
        },
        'neon': {
          'accent': '#00FFA3',
          'alt': '#7B61FF',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'display': ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '9xl': ['8rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1.1' }],
        '7xl': ['4rem', { lineHeight: '1.1' }],
        '6xl': ['3.5rem', { lineHeight: '1.1' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 255, 163, 0.3)',
        'neon-lg': '0 0 40px rgba(0, 255, 163, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
