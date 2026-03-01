/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#00e88f', hover: '#00cc7a', dark: '#00a362' },
        secondary:{ DEFAULT: '#00b8ff', hover: '#0099cc' },
        danger:   { DEFAULT: '#ff4d6d', hover: '#e6395a' },
        warning:  { DEFAULT: '#f0a500', hover: '#d49200' },
        bg: {
          primary: '#07090f',
          card:    '#0e1117',
          elevated:'#151b26',
        },
        surface: {
          border: '#1e2535',
          muted:  '#2a3347',
        },
        text: {
          primary:   '#e8eaf0',
          secondary: '#8892a8',
          muted:     '#52607a',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #00e88f 0%, #00b8ff 100%)',
        'gradient-dark':  'linear-gradient(180deg, #07090f 0%, #0e1117 100%)',
        'card-glow':      'radial-gradient(ellipse at top, rgba(0,232,143,0.06) 0%, transparent 70%)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-green': { '0%,100%': { boxShadow: '0 0 0 0 rgba(0,232,143,0.3)' }, '50%': { boxShadow: '0 0 0 6px rgba(0,232,143,0)' } },
      },
      animation: {
        'fade-in':    'fade-in 0.3s ease-out',
        'pulse-green':'pulse-green 2s infinite',
      },
    },
  },
  plugins: [],
}
