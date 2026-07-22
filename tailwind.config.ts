import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F3EBFF', 100: '#E0CCFF', 200: '#C4A3FF', 300: '#A87AFF',
          400: '#8C51FF', 500: '#7C4DFF', 600: '#651FFF', 700: '#4D00CC',
          800: '#3A0099', 900: '#260066',
        },
        secondary: {
          50: '#FFF0F4', 100: '#FFD6E2', 200: '#FFADC6', 300: '#FF85A9',
          400: '#FF5C8D', 500: '#FF6B9D', 600: '#E64A7A', 700: '#CC2E5E',
          800: '#991A42', 900: '#660D2B',
        },
        accent: {
          50: '#E6F9FF', 100: '#B3EEFF', 200: '#80E0FF', 300: '#4DD2FF',
          400: '#4FC3F7', 500: '#29B6F6', 600: '#039BE5', 700: '#0277BD',
          800: '#01579B', 900: '#003D6B',
        },
      },
      fontFamily: {
        sans: ["'Nunito'", 'system-ui', 'sans-serif'],
        display: ["'Nunito'", 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
