/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          'surface-2': 'var(--surface-2)',
          line: 'var(--line)',
          text: 'var(--text)',
          'text-dim': 'var(--text-dim)',
        },
        terracotta: {
          DEFAULT: 'var(--accent-primary)',
          50: '#FDF6F4',
          100: '#FAEBE6',
          200: '#F5D7CE',
          300: '#EBBBAF',
          400: '#E29780',
          500: '#D97757',
          600: '#C25D3B',
          700: '#9C472A',
        },
        sage: {
          DEFAULT: 'var(--accent-secondary)',
          500: '#8C9C7C',
          600: '#758565',
        },
        dusty: {
          DEFAULT: 'var(--accent-tertiary)',
          500: '#5B7C99',
          600: '#486580',
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'paper-sm': '0 1px 3px rgba(38, 38, 36, 0.05)',
        'paper-md': '0 4px 12px rgba(38, 38, 36, 0.06)',
        'paper-lg': '0 8px 24px rgba(38, 38, 36, 0.08)',
      }
    },
  },
  plugins: [],
}
