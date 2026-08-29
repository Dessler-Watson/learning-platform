import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        edu: {
          pink: '#F087A9',
          'pink-light': '#F5A5C0',
          'pink-dark': '#D96B91',
          blue: '#30BCE6',
          'blue-light': '#5CCDF0',
          'blue-dark': '#1A9FCC',
          yellow: '#FDDB33',
          'yellow-light': '#FDF293',
          'yellow-dark': '#E5C52E',
          red: '#E94930',
          'red-light': '#F07060',
          'red-dark': '#C93A24',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F8FAFE',
          100: '#F0F4FA',
          200: '#E4EAF4',
          300: '#CDD6E4',
          400: '#A0ADC4',
          500: '#6B7A94',
          600: '#4A5770',
          700: '#344054',
          800: '#1E2A3A',
          900: '#0F1923',
          950: '#080E15',
        },
      },
      fontFamily: {
        sans: ["'Fredoka'", "'Nunito'", 'system-ui', 'sans-serif'],
        display: ["'Fredoka'", "'Nunito'", 'system-ui', 'sans-serif'],
        body: ["'Nunito'", 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'game': '0 6px 24px rgba(48, 188, 230, 0.25), 0 2px 8px rgba(0,0,0,0.1)',
        'game-lg': '0 8px 32px rgba(48, 188, 230, 0.3), 0 4px 12px rgba(0,0,0,0.12)',
        'pink': '0 6px 24px rgba(240, 135, 169, 0.3)',
        'yellow': '0 6px 24px rgba(253, 219, 51, 0.3)',
        'red': '0 6px 24px rgba(233, 73, 48, 0.3)',
        'soft': '0 2px 12px rgba(0,0,0,0.06)',
        'card': '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
